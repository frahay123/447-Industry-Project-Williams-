import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { apiFetch } from '../../api/client';
import {
  canAddInventoryItem,
  canAdjustInventoryQuantity,
} from '../../permissions';

export function useInventory() {
  const { session, apiSession } = useAuth();
  const { selectedProjectId, refreshProjects } = useProject();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('warehouse');
  const [saveError, setSaveError] = useState('');

  const canAdd = canAddInventoryItem(session?.roleId);
  const canAdjustQty = canAdjustInventoryQuantity(session?.roleId);

  const load = useCallback(async () => {
    if (!apiSession) {
      setLoading(false);
      return;
    }
    if (selectedProjectId == null) {
      setItems([]);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const inv = await apiFetch(
        `/api/inventory?projectId=${selectedProjectId}`,
        {},
        apiSession,
      );
      setItems(Array.isArray(inv) ? inv : []);
    } catch (e) {
      setError(e.message || 'Failed to load inventory.');
      setItems([]);
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

  const addItem = useCallback(async () => {
    setSaveError('');
    if (selectedProjectId == null) {
      setSaveError('Select a job on the Dashboard first.');
      return;
    }
    try {
      await apiFetch(
        '/api/inventory',
        {
          method: 'POST',
          body: {
            description: description.trim(),
            quantity: parseInt(quantity, 10) || 0,
            location: location.trim() || 'warehouse',
            projectId: selectedProjectId,
          },
        },
        apiSession,
      );
      setDescription('');
      setQuantity('1');
      setLocation('warehouse');
      await load();
      await refreshProjects();
    } catch (e) {
      setSaveError(e.message || 'Could not add line.');
    }
  }, [
    description,
    quantity,
    location,
    selectedProjectId,
    apiSession,
    load,
    refreshProjects,
  ]);

  const changeQty = useCallback(
    async (id, delta) => {
      const row = items.find((x) => x.id === id);
      if (!row) return;
      const next = Math.max(0, (row.quantity ?? 0) + delta);
      try {
        await apiFetch(
          `/api/inventory/${id}`,
          { method: 'PATCH', body: { quantity: next } },
          apiSession,
        );
        await load();
      } catch {
        /* ignore */
      }
    },
    [items, apiSession, load],
  );

  return {
    items,
    loading,
    error,
    canAdd,
    canAdjustQty,
    needsProject: selectedProjectId == null,
    description,
    setDescription,
    quantity,
    setQuantity,
    location,
    setLocation,
    saveError,
    addItem,
    changeQty,
    reload: load,
  };
}
