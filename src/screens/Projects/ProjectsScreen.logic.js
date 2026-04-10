import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { apiFetch } from '../../api/client';
import { canCreateProject, canDeleteProject } from '../../permissions';

export function useProjects() {
  const { session, apiSession } = useAuth();
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    refreshProjects,
  } = useProject();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [location, setLocation] = useState('');
  const [saveError, setSaveError] = useState('');

  const canAdd = canCreateProject(session?.roleId);
  const canRemove = canDeleteProject(session?.roleId);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await refreshProjects();
    } catch (e) {
      setError(e.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [session, refreshProjects]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const createProject = useCallback(async () => {
    setSaveError('');
    try {
      const row = await apiFetch(
        '/api/projects',
        {
          method: 'POST',
          body: {
            name: name.trim(),
            jobNumber: jobNumber.trim() || undefined,
            location: location.trim() || undefined,
          },
        },
        apiSession,
      );
      setName('');
      setJobNumber('');
      setLocation('');
      await refreshProjects();
      if (row?.id != null) {
        await setSelectedProjectId(row.id);
      }
    } catch (e) {
      setSaveError(e.message || 'Could not create project.');
    }
  }, [name, jobNumber, location, apiSession, refreshProjects, setSelectedProjectId]);

  const selectAsCurrent = useCallback(
    async (id) => {
      await setSelectedProjectId(id);
    },
    [setSelectedProjectId],
  );

  const removeProject = useCallback(
    async (id) => {
      try {
        await apiFetch(
          `/api/projects/${id}/remove`,
          { method: 'POST', body: {} },
          apiSession,
        );
        if (selectedProjectId === id) {
          await setSelectedProjectId(null);
        }
        await refreshProjects();
      } catch (e) {
        Alert.alert(
          'Could not remove project',
          e.message || 'Request failed.',
        );
      }
    },
    [
      apiSession,
      refreshProjects,
      selectedProjectId,
      setSelectedProjectId,
    ],
  );

  const confirmRemoveProject = useCallback(
    (p) => {
      Alert.alert(
        'Remove project',
        `Delete "${p.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeProject(p.id),
          },
        ],
      );
    },
    [removeProject],
  );

  return {
    projects,
    selectedProjectId,
    loading,
    error,
    canAdd,
    canRemove,
    name,
    setName,
    jobNumber,
    setJobNumber,
    location,
    setLocation,
    saveError,
    createProject,
    selectAsCurrent,
    confirmRemoveProject,
    reload: load,
  };
}
