import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';

const API_BASE = 'http://44.207.201.121';

export function usePoRequests() {
  const { session, apiSession } = useAuth();
  const { selectedProjectId } = useProject();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!apiSession) return;
    try {
      setLoading(true);
      setError('');
      const pid = selectedProjectId ? `?projectId=${selectedProjectId}` : '';
      const res = await fetch(`${API_BASE}/api/issue-threads${pid}`, {
        headers: { 'Authorization': `Bearer ${apiSession}` }
      });
      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiSession, selectedProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const resolveThread = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/issue-threads/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiSession}`
        },
        body: JSON.stringify({ status: 'resolved' })
      });
      if (res.ok) load();
    } catch (err) {
      console.error('Failed to resolve thread:', err);
    }
  };

  return {
    threads,
    loading,
    error,
    isPM: session?.roleId === 2,
    reload: load,
    resolveThread,
    session,
    apiSession
  };
}
