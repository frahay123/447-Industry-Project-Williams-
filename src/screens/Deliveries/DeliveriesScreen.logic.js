import { useState, useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { apiFetch } from '../../api/client';
import { getApiBaseUrl } from '../../config/api';
import { canUploadPackingSlip } from '../../permissions';

export function useDeliveries() {
  const { session, apiSession } = useAuth();
  const { selectedProjectId, refreshProjects } = useProject();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const canUpload = canUploadPackingSlip(session?.roleId);

  const slipImageHeaders = useMemo(
    () => ({
      'X-User-Name': session?.username ?? '',
      'X-User-Role': session?.roleId ?? '',
    }),
    [session?.username, session?.roleId],
  );

  const getSlipImageSource = useCallback(
    (slipId) => ({
      uri: `${getApiBaseUrl()}/api/packing-slips/${slipId}/image`,
      headers: slipImageHeaders,
    }),
    [slipImageHeaders],
  );

  const load = useCallback(async () => {
    if (!apiSession) {
      setLoading(false);
      return;
    }
    if (selectedProjectId == null) {
      setSlips([]);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const s = await apiFetch(
        `/api/packing-slips?projectId=${selectedProjectId}`,
        {},
        apiSession,
      );
      setSlips(Array.isArray(s) ? s : []);
    } catch (e) {
      setError(e.message || 'Failed to load.');
      setSlips([]);
    } finally {
      setLoading(false);
    }
  }, [apiSession, selectedProjectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [selectedProjectId, load]);

  const pickAndUpload = useCallback(async () => {
    setUploadError('');
    if (selectedProjectId == null) {
      setUploadError('Select a job on the Dashboard first.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setUploadError('Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const form = new FormData();
      form.append('projectId', String(selectedProjectId));
      const ext = asset.mimeType?.includes('png') ? 'png' : 'jpg';
      form.append('photo', {
        uri: asset.uri,
        name: `slip.${ext}`,
        type: asset.mimeType || 'image/jpeg',
      });
      await apiFetch('/api/packing-slips', { method: 'POST', body: form }, apiSession);
      await load();
      await refreshProjects();
    } catch (e) {
      setUploadError(e.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }, [selectedProjectId, apiSession, load, refreshProjects]);

  return {
    slips,
    loading,
    error,
    canUpload,
    needsProject: selectedProjectId == null,
    uploadError,
    uploading,
    pickAndUpload,
    reload: load,
    getSlipImageSource,
  };
}
