import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { apiFetch } from '../../api/client';
import {
  canCreateMaterialRequest,
  canApproveRequests,
} from '../../permissions';

export function useRequests() {
  const { session, apiSession } = useAuth();
  const { selectedProjectId, refreshProjects } = useProject();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [saveError, setSaveError] = useState('');

  const canCreate = canCreateMaterialRequest(session?.roleId);
  const canApprove = canApproveRequests(session?.roleId);

  const load = useCallback(async () => {
    if (!apiSession) {
      setLoading(false);
      return;
    }
    if (selectedProjectId == null) {
      setRequests([]);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch(
        `/api/requests?projectId=${selectedProjectId}`,
        {},
        apiSession,
      );
      setRequests(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(e.message || 'Failed to load requests.');
      setRequests([]);
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

  const submitRequest = useCallback(async () => {
    setSaveError('');
    if (selectedProjectId == null) {
      setSaveError('Select a job on the Dashboard first.');
      return;
    }
    try {
      await apiFetch(
        '/api/requests',
        {
          method: 'POST',
          body: {
            description: description.trim(),
            quantity: parseInt(quantity, 10) || 1,
            notes: notes.trim() || undefined,
            projectId: selectedProjectId,
          },
        },
        apiSession,
      );
      setDescription('');
      setQuantity('1');
      setNotes('');
      await load();
      await refreshProjects();
    } catch (e) {
      setSaveError(e.message || 'Could not submit request.');
    }
  }, [description, quantity, notes, selectedProjectId, apiSession, load, refreshProjects]);

  const setStatus = useCallback(
    async (id, status) => {
      try {
        await apiFetch(
          `/api/requests/${id}`,
          { method: 'PATCH', body: { status } },
          apiSession,
        );
        await load();
      } catch {
        /* ignore */
      }
    },
    [apiSession, load],
  );

  return {
    requests,
    loading,
    error,
    canCreate,
    canApprove,
    needsProject: selectedProjectId == null,
    description,
    setDescription,
    quantity,
    setQuantity,
    notes,
    setNotes,
    saveError,
    submitRequest,
    setStatus,
    reload: load,
  };
}
