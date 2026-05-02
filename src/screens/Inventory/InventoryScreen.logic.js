<<<<<<< HEAD
import { useState, useCallback, useEffect } from 'react';
=======
import { useState, useCallback, useEffect, useMemo } from 'react';
>>>>>>> main
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
<<<<<<< HEAD
  const { selectedProjectId, refreshProjects } = useProject();
=======
  const { projects, selectedProjectId, refreshProjects } = useProject();
>>>>>>> main
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
<<<<<<< HEAD
  const [location, setLocation] = useState('warehouse');
  const [saveError, setSaveError] = useState('');

  const canAdd = canAddInventoryItem(session?.roleId);
=======
  const [location, setLocation] = useState('');
  const [saveError, setSaveError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const [settings, setSettings] = useState({ warehouse1_name: '', warehouse2_name: '' });

  const loadSettings = useCallback(async () => {
    if (!apiSession) return;
    try {
      const data = await apiFetch('/api/settings', {}, apiSession);
      if (data) {
        setSettings(data);
        if (data.warehouse1_name?.trim()) {
          setLocation(data.warehouse1_name.trim());
        }
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }, [apiSession]);

  const locationOptions = useMemo(() => {
    const opts = [];
    if (settings.warehouse1_name?.trim()) {
      opts.push(settings.warehouse1_name.trim());
    }
    if (settings.warehouse2_name?.trim()) {
      opts.push(settings.warehouse2_name.trim());
    }
    const sel = projects.find((p) => p.id === selectedProjectId);
    if (sel?.location?.trim()) {
      opts.push(sel.location.trim());
    }
    if (opts.length === 0) {
      opts.push('warehouse', 'yard', 'jobsite', 'transit');
    }
    return opts;
  }, [settings, projects, selectedProjectId]);

  const canAdd = canAddInventoryItem(session?.roleId) || session?.roleId === 'project_manager';
>>>>>>> main
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
<<<<<<< HEAD
    }, [load]),
=======
      loadSettings();
    }, [load, loadSettings]),
>>>>>>> main
  );

  useEffect(() => {
    load();
<<<<<<< HEAD
  }, [selectedProjectId, load]);
=======
    loadSettings();
  }, [selectedProjectId, load, loadSettings]);
>>>>>>> main

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

<<<<<<< HEAD
  return {
    items,
=======
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesName = !searchQuery || (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLoc = !filterLocation || item.location === filterLocation;
      return matchesName && matchesLoc;
    });
  }, [items, searchQuery, filterLocation]);

  return {
    items: filteredItems,
>>>>>>> main
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
<<<<<<< HEAD
=======
    searchQuery,
    setSearchQuery,
    filterLocation,
    setFilterLocation,
    locationOptions,
>>>>>>> main
  };
}
