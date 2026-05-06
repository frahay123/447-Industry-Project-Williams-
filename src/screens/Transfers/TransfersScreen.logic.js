import { useState, useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { apiFetch } from '../../api/client';
import { canCreateTransfer, canAdvanceTransfer } from '../../permissions';

export function useTransfers() {
  const { session, apiSession } = useAuth();
  const { projects, selectedProjectId, refreshProjects } = useProject();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [settings, setSettings] = useState({ warehouse1_name: '', warehouse2_name: '' });
  const [inventoryItems, setInventoryItems] = useState([]);

  const canCreate = canCreateTransfer(session?.roleId);
  const canAdvance = canAdvanceTransfer(session?.roleId);

  /** Warehouse names + jobsite location from the selected project — same logic as Inventory. */
  const transferSites = useMemo(() => {
    const sites = [];
    if (settings.warehouse1_name?.trim()) {
      sites.push({ value: settings.warehouse1_name.trim(), label: settings.warehouse1_name.trim() });
    }
    if (settings.warehouse2_name?.trim()) {
      sites.push({ value: settings.warehouse2_name.trim(), label: settings.warehouse2_name.trim() });
    }
    const sel = projects.find((p) => p.id === selectedProjectId);
    if (sel?.location?.trim()) {
      sites.push({ value: sel.location.trim(), label: sel.location.trim() });
    }
    // Fallback if settings haven't loaded yet
    if (sites.length === 0) {
      sites.push({ value: 'warehouse', label: 'Warehouse' });
      sites.push({ value: 'jobsite', label: 'Jobsite' });
    }
    return sites;
  }, [settings, projects, selectedProjectId]);

  const loadSettings = useCallback(async () => {
    if (!apiSession) return;
    try {
      const data = await apiFetch('/api/settings', {}, apiSession);
      if (data) setSettings(data);
    } catch { /* non-fatal */ }
  }, [apiSession]);

  const loadInventory = useCallback(async () => {
    if (!apiSession || selectedProjectId == null) { setInventoryItems([]); return; }
    try {
      const data = await apiFetch(`/api/inventory?projectId=${selectedProjectId}`, {}, apiSession);
      setInventoryItems(Array.isArray(data) ? data : []);
    } catch { setInventoryItems([]); }
  }, [apiSession, selectedProjectId]);

  /** Items at the selected "From" location with stock > 0. */
  const inventoryAtFrom = useMemo(() => {
    if (!fromLocation) return [];
    return inventoryItems.filter(
      (item) =>
        item.quantity > 0 &&
        item.location &&
        item.location.toLowerCase().trim() === fromLocation.toLowerCase().trim(),
    );
  }, [inventoryItems, fromLocation]);

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

  useFocusEffect(useCallback(() => { load(); loadSettings(); loadInventory(); }, [load, loadSettings, loadInventory]));
  useEffect(() => { load(); loadSettings(); loadInventory(); }, [selectedProjectId, load, loadSettings, loadInventory]);

  // Reset selection when project or from-location changes
  useEffect(() => {
    setFromLocation(null);
    setToLocation(null);
    setDescription('');
    setQuantity('1');
    setSaveError('');
  }, [selectedProjectId]);

  useEffect(() => {
    setDescription('');
    setQuantity('1');
    setUnit('');
  }, [fromLocation]);

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
            unit: unit.trim() || undefined,
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
      setUnit('');
      setNotes('');
      setFromLocation(null);
      setToLocation(null);
      await load();
      await loadInventory();
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
    loadInventory,
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
    unit,
    setUnit,
    notes,
    setNotes,
    fromLocation,
    setFromLocation,
    toLocation,
    setToLocation,
    transferSites,
    inventoryAtFrom,
    saveError,
    submitTransfer,
    advanceStatus,
    reload: load,
  };
}
