import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { apiFetch } from '../../api/client';
import { canCreateTransfer, canAdvanceTransfer } from '../../permissions';

/** Same job: material moves between these two inventory sites (see Inventory screen). */
export const TRANSFER_SITES = [
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'jobsite', label: 'Jobsite' },
];

export function useTransfers() {
  const { session, apiSession } = useAuth();
  const { selectedProjectId, refreshProjects } = useProject();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const [saveError, setSaveError] = useState('');

  const canCreate = canCreateTransfer(session?.roleId);
  const canAdvance = canAdvanceTransfer(session?.roleId);

  const load = useCallback(async () => {
    if (!apiSession) {
      setLoading(false);
      return;
    }
    if (selectedProjectId == null) {
      setTransfers([]);
      setError('');
      setLoading(false);
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
      setTransfers(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(e.message || 'Failed to load transfers.');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [apiSession, selectedProjectId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [selectedProjectId, load]);

  useEffect(() => {
    setFromLocation(null);
    setToLocation(null);
    setSaveError('');
  }, [selectedProjectId]);

  const submitTransfer = useCallback(async () => {
    setSaveError('');
    if (selectedProjectId == null) {
      setSaveError('Select a job on the Dashboard first.');
      return;
    }
    if (!fromLocation) {
      setSaveError('Select a source site.');
      return;
    }
    if (!toLocation) {
      setSaveError('Select a destination site.');
      return;
    }
    if (fromLocation === toLocation) {
      setSaveError('Source and destination must be different.');
      return;
    }
    if (!description.trim()) {
      setSaveError('Enter a material description.');
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
            sourceProjectId: selectedProjectId,
            sourceLocation: fromLocation,
            destLocation: toLocation,
          },
        },
        apiSession,
      );
      setDescription('');
      setQuantity('1');
      setNotes('');
      setFromLocation(null);
      setToLocation(null);
      await load();
      await refreshProjects();
    } catch (e) {
      setSaveError(e.message || 'Could not submit transfer.');
    }
  }, [
    description,
    quantity,
    notes,
    fromLocation,
    toLocation,
    selectedProjectId,
    apiSession,
    load,
    refreshProjects,
  ]);

  const advanceStatus = useCallback(
    async (id, nextStatus) => {
      try {
        await apiFetch(
          `/api/requests/${id}`,
          { method: 'PATCH', body: { status: nextStatus } },
          apiSession,
        );
        await load();
      } catch { /* ignore */ }
    },
    [apiSession, load],
  );

  return {
    transfers,
    loading,
    error,
    canCreate,
    canAdvance,
    needsProject: selectedProjectId == null,
    selectedProjectId,
    description,
    setDescription,
    quantity,
    setQuantity,
    notes,
    setNotes,
    fromLocation,
    setFromLocation,
    toLocation,
    setToLocation,
    transferSites: TRANSFER_SITES,
    saveError,
    submitTransfer,
    advanceStatus,
    reload: load,
  };
}
