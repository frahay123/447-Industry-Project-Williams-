import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { getRoleById, ROLE_IDS, ROLES_REVISION } from '../../constants/roles';
import { apiFetch } from '../../api/client';

const EMPTY_STATS = [
  { label: 'Current job', value: '\u2014', color: '#3b82f6' },
  { label: 'Packing slips', value: '\u2014', color: '#22c55e' },
  { label: 'Inventory lines', value: '\u2014', color: '#f59e0b' },
  { label: 'Pending transfers', value: '\u2014', color: '#ef4444' },
];

function buildStats(s, session) {
  const jobLabel =
    s.scope === 'project' && s.projectName
      ? s.projectName
      : s.scope === 'project'
        ? '(unknown job)'
        : '\u2014';

  const base = [
    { label: 'Current job', value: jobLabel, color: '#3b82f6' },
    { label: 'Packing slips', value: String(s.packingSlips), color: '#22c55e' },
    { label: 'Inventory lines', value: String(s.inventoryItems), color: '#f59e0b' },
    { label: 'Pending transfers', value: String(s.pendingRequests), color: '#ef4444' },
  ];

  if (session?.roleId === ROLE_IDS.PROJECT_MANAGER && s.purchaseOrders != null) {
    base.push({ label: 'Purchase orders', value: String(s.purchaseOrders), color: '#8b5cf6' });
  }

  return base;
}

export function useDashboard() {
  const { session, apiSession, logout } = useAuth();
  const { selectedProjectId, ready: projectReady } = useProject();
  const [username, setUsername] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [stats, setStats] = useState(EMPTY_STATS);
  const [apiError, setApiError] = useState('');

  const load = useCallback(async () => {
    if (!session?.username) return;
    setUsername(session.username);
    setRoleLabel(getRoleById(session.roleId)?.label ?? session.roleId);

    if (!projectReady || !apiSession) return;

    if (selectedProjectId == null) {
      setStats(EMPTY_STATS);
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
      setStats(buildStats(s, session));
    } catch (e) {
      setApiError(e.message || 'Could not reach the server.');
      setStats(EMPTY_STATS);
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
