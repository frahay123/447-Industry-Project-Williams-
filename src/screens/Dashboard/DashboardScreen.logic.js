import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { getRoleById, ROLES_REVISION } from '../../constants/roles';
import { apiFetch } from '../../api/client';

export function useDashboard() {
  const { session, apiSession, logout } = useAuth();
  const { selectedProjectId, ready: projectReady } = useProject();
  const [username, setUsername] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [stats, setStats] = useState([
    { label: 'Current job', value: '—', color: '#3b82f6' },
    { label: 'Packing slips', value: '—', color: '#22c55e' },
    { label: 'Inventory lines', value: '—', color: '#f59e0b' },
    { label: 'Pending requests', value: '—', color: '#ef4444' },
  ]);
  const [apiError, setApiError] = useState('');

  const load = useCallback(async () => {
    if (!session?.username) return;
    setUsername(session.username);
    setRoleLabel(getRoleById(session.roleId)?.label ?? session.roleId);

    if (!projectReady || !apiSession) return;

    if (selectedProjectId == null) {
      setStats([
        { label: 'Current job', value: '—', color: '#3b82f6' },
        { label: 'Packing slips', value: '—', color: '#22c55e' },
        { label: 'Inventory lines', value: '—', color: '#f59e0b' },
        { label: 'Pending requests', value: '—', color: '#ef4444' },
      ]);
      setApiError('');
      return;
    }

    try {
      setApiError('');
      const s = await apiFetch(
        `/api/summary?projectId=${selectedProjectId}`,
        {},
        apiSession,
      );
      const jobLabel =
        s.scope === 'project' && s.projectName
          ? s.projectName
          : s.scope === 'project'
            ? '(unknown job)'
            : '—';
      setStats([
        { label: 'Current job', value: jobLabel, color: '#3b82f6' },
        { label: 'Packing slips', value: String(s.packingSlips), color: '#22c55e' },
        {
          label: 'Inventory lines',
          value: String(s.inventoryItems),
          color: '#f59e0b',
        },
        {
          label: 'Pending requests',
          value: String(s.pendingRequests),
          color: '#ef4444',
        },
      ]);
    } catch (e) {
      setApiError(e.message || 'Could not reach the server.');
      setStats([
        { label: 'Current job', value: '—', color: '#3b82f6' },
        { label: 'Packing slips', value: '—', color: '#22c55e' },
        { label: 'Inventory lines', value: '—', color: '#f59e0b' },
        { label: 'Pending requests', value: '—', color: '#ef4444' },
      ]);
    }
  }, [
    session,
    apiSession,
    selectedProjectId,
    projectReady,
    ROLES_REVISION,
  ]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [selectedProjectId, projectReady, load]);

  return {
    username,
    roleLabel,
    stats,
    apiError,
    logout,
    retry: load,
  };
}
