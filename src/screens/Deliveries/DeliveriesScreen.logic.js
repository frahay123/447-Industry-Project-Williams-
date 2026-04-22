import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { apiFetch } from '../../api/client';
import { getApiBaseUrl } from '../../config/api';
import { canUploadPackingSlip, canAddDeliveryItems } from '../../permissions';

/** Match backend /inventory-locations keys; helps pair slip SKUs with long inventory descriptions. */
export function normInventoryDescKey(description) {
  return String(description ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const MIN_PLACEMENT_SUBSTRING_LEN = 5;

/** Merge rows that share the same normalized description (e.g. repeated SKU lines). */
export function groupSlipItemsByDescription(items) {
  const map = new Map();
  for (const it of items) {
    const k = normInventoryDescKey(it.description);
    const label = String(it.description ?? '').trim();
    const qty = Math.max(0, Number(it.quantity_received) || 0);
    const mapKey = k || `__raw_${label || map.size}`;
    const existing = map.get(mapKey);
    if (existing) {
      existing.receivedOnSlip += qty;
      if (label.length > existing.description.length) existing.description = label;
    } else {
      map.set(mapKey, {
        rowKey: mapKey,
        description: label,
        receivedOnSlip: qty,
      });
    }
  }
  return Array.from(map.values());
}

export function resolvePlacementsForDescription(inventoryByDesc, description) {
  const k = normInventoryDescKey(description);
  if (!k) return [];
  const exact = inventoryByDesc[k];
  if (exact?.length) return exact;

  const merged = [];
  const seen = new Set();
  for (const invKey of Object.keys(inventoryByDesc)) {
    if (!invKey) continue;
    const longer = invKey.length >= k.length ? invKey : k;
    const shorter = invKey.length >= k.length ? k : invKey;
    if (shorter.length < MIN_PLACEMENT_SUBSTRING_LEN) continue;
    if (!longer.includes(shorter)) continue;
    for (const row of inventoryByDesc[invKey]) {
      const dedupe = `${row.location}\0${row.quantity}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      merged.push(row);
    }
  }
  return merged;
}

export function useDeliveries() {
  const { session, apiSession } = useAuth();
  const { projects, selectedProjectId, refreshProjects } = useProject();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [shortages, setShortages] = useState([]);
  const [shortageLoading, setShortageLoading] = useState(false);
  /** Lowercase trimmed description → [{ location, quantity }] */
  const [inventoryByDesc, setInventoryByDesc] = useState({});

  const [editingSlipId, setEditingSlipId] = useState(null);
  const [lineItems, setLineItems] = useState([{ description: '', quantity_received: '0', location: '' }]);
  const [lineItemError, setLineItemError] = useState('');
  const [existingItems, setExistingItems] = useState({});

  // Extraction state (suggested items from Bedrock on upload)
  const [suggestedItems, setSuggestedItems] = useState({});

  // PO matching state
  const [matchPromptSlipId, setMatchPromptSlipId] = useState(null);
  const [suggestedMatchPo, setSuggestedMatchPo] = useState(null);
  const [unmatchedPos, setUnmatchedPos] = useState([]);
  const [matchPromptMode, setMatchPromptMode] = useState(null); // null | 'auto' | 'manual'
  const [matching, setMatching] = useState(false);

  const canUpload = canUploadPackingSlip(session?.roleId);
  const canAddItems = canAddDeliveryItems(session?.roleId);

  const [settings, setSettings] = useState({ warehouse1_name: '', warehouse2_name: '' });

  const loadSettings = useCallback(async () => {
    if (!apiSession) return;
    try {
      const data = await apiFetch('/api/settings', {}, apiSession);
      if (data) setSettings(data);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }, [apiSession]);

  const locationOptions = useMemo(() => {
    const opts = [];
    if (settings.warehouse1_name?.trim()) {
      opts.push({ id: settings.warehouse1_name.trim(), label: settings.warehouse1_name.trim() });
    }
    if (settings.warehouse2_name?.trim()) {
      opts.push({ id: settings.warehouse2_name.trim(), label: settings.warehouse2_name.trim() });
    }
    const sel = projects.find((p) => p.id === selectedProjectId);
    if (sel?.location?.trim()) {
      opts.push({ id: sel.location.trim(), label: sel.location.trim() });
    }
    if (opts.length === 0) {
      const fallback = sel?.location?.trim() || 'warehouse';
      opts.push({ id: fallback, label: fallback });
    }
    return opts;
  }, [settings, projects, selectedProjectId]);

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

  const loadSlips = useCallback(async () => {
    if (!apiSession || selectedProjectId == null) {
      setSlips([]);
      setLoading(false);
      setError('');
      return;
    }
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
    }
  }, [apiSession, selectedProjectId]);

  const load = useCallback(async () => {
    if (!apiSession || selectedProjectId == null) {
      setSlips([]);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        refreshProjects(),
        loadSlips(),
        loadSettings(),
      ]);
    } catch (e) {
      setError(e.message || 'Failed to load deliveries.');
    } finally {
      setLoading(false);
    }
  }, [apiSession, selectedProjectId, loadSlips, refreshProjects, loadSettings]);

  const loadShortages = useCallback(async () => {
    if (!apiSession || selectedProjectId == null) { setShortages([]); return; }
    setShortageLoading(true);
    try {
      const data = await apiFetch(
        `/api/projects/${selectedProjectId}/shortages`,
        {},
        apiSession,
      );
      setShortages(Array.isArray(data) ? data : []);
    } catch {
      setShortages([]);
    } finally {
      setShortageLoading(false);
    }
  }, [apiSession, selectedProjectId]);

  const loadInventoryLocations = useCallback(async () => {
    if (!apiSession || selectedProjectId == null) {
      setInventoryByDesc({});
      return;
    }
    try {
      const data = await apiFetch(
        `/api/projects/${selectedProjectId}/inventory-locations`,
        {},
        apiSession,
      );
      setInventoryByDesc(data && typeof data === "object" ? data : {});
    } catch {
      setInventoryByDesc({});
    }
  }, [apiSession, selectedProjectId]);

  const getPlacementsForDescription = useCallback(
    (description) => resolvePlacementsForDescription(inventoryByDesc, description),
    [inventoryByDesc],
  );

  const defaultLocation = useMemo(() => {
    const sel = projects.find((p) => p.id === selectedProjectId);
    return sel?.location || 'TBD';
  }, [projects, selectedProjectId]);

  useFocusEffect(
    useCallback(() => {
      load();
      loadShortages();
      loadInventoryLocations();
    }, [load, loadShortages, loadInventoryLocations]),
  );
  useEffect(() => {
    load();
    loadShortages();
    loadInventoryLocations();
  }, [selectedProjectId, load, loadShortages, loadInventoryLocations]);

  const loadSlipItems = useCallback(async (slipId) => {
    try {
      const items = await apiFetch(`/api/packing-slips/${slipId}/items`, {}, apiSession);
      setExistingItems((prev) => ({ ...prev, [slipId]: Array.isArray(items) ? items : [] }));
    } catch { /* ignore */ }
  }, [apiSession]);

  const toggleEditSlip = useCallback((slipId) => {
    if (editingSlipId === slipId) {
      setEditingSlipId(null);
      setLineItems([{ description: '', quantity_received: '0', location: defaultLocation }]);
      return;
    }
    setEditingSlipId(slipId);
    setLineItemError('');
    loadSlipItems(slipId);

    // Pre-fill from suggested items if available and no existing items yet
    const suggestions = suggestedItems[slipId];
    const existing = existingItems[slipId];
    if (Array.isArray(suggestions) && suggestions.length > 0 && (!existing || existing.length === 0)) {
      setLineItems(
        suggestions.map((it) => ({
          description: it.description || '',
          quantity_received: String(it.quantity_received || 0),
          location: defaultLocation,
        })),
      );
    } else {
      setLineItems([{ description: '', quantity_received: '0', location: defaultLocation }]);
    }
  }, [editingSlipId, loadSlipItems, defaultLocation, suggestedItems, existingItems]);

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, { description: '', quantity_received: '0', location: defaultLocation }]);
  }, [defaultLocation]);

  const updateLineItem = useCallback((index, field, value) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }, []);

  const removeLineItem = useCallback((index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submitLineItems = useCallback(async () => {
    setLineItemError('');
    if (editingSlipId == null) return;
    const valid = lineItems.filter((it) => it.description.trim());
    if (valid.length === 0) { setLineItemError('Add at least one item.'); return; }
    const coerceLoc = (loc) => {
      const v = (loc && String(loc).trim()) || '';
      if (v && locationOptions.some((o) => o.id === v)) return v;
      return locationOptions[0]?.id || defaultLocation;
    };
    try {
      await apiFetch(
        `/api/packing-slips/${editingSlipId}/items`,
        {
          method: 'POST',
          body: {
            items: valid.map((it) => ({
              description: it.description.trim(),
              quantity_received: parseInt(it.quantity_received, 10) || 0,
              location: coerceLoc(it.location),
            })),
          },
        },
        apiSession,
      );
      await loadSlipItems(editingSlipId);
      setLineItems([{ description: '', quantity_received: '0', location: defaultLocation }]);
      setEditingSlipId(null);
      setLineItemError('');
      await load();
      await loadShortages();
      await loadInventoryLocations();
    } catch (e) {
      setLineItemError(e.message || 'Failed to save items.');
    }
  }, [editingSlipId, lineItems, defaultLocation, locationOptions, apiSession, loadSlipItems, load, loadShortages, loadInventoryLocations]);

  const processAndUploadImage = useCallback(
    async (uri, mimeType) => {
      setUploading(true);
      try {
        // Always compress and convert to JPEG for Bedrock/Nova Pro compatibility
        // (handles HEIC from iOS).
        const manipResult = await ImageManipulator.manipulateAsync(uri, [], {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        const finalUri = manipResult.uri;
        const form = new FormData();
        form.append('projectId', String(selectedProjectId));
        form.append('photo', {
          uri: finalUri,
          name: 'slip.jpg',
          type: 'image/jpeg',
        });

        const slipData = await apiFetch(
          '/api/packing-slips',
          { method: 'POST', body: form, timeoutMs: 60_000 },
          apiSession,
        );

        const slipId = slipData?.id;
        if (slipId) {
          const suggestions = Array.isArray(slipData.suggestedItems) ? slipData.suggestedItems : [];
          if (suggestions.length > 0) {
            setSuggestedItems((prev) => ({ ...prev, [slipId]: suggestions }));
          }
          await loadSlipItems(slipId);
          setLineItemError('');
          setEditingSlipId(slipId);
          if (suggestions.length > 0) {
            setLineItems(
              suggestions.map((it) => ({
                description: it.description || '',
                quantity_received: String(it.quantity_received ?? 0),
                location: defaultLocation,
              })),
            );
          } else {
            setLineItems([{ description: '', quantity_received: '0', location: defaultLocation }]);
          }

          // Handle PO matching suggestion
          if (slipData.suggestedMatchPo) {
            setSuggestedMatchPo(slipData.suggestedMatchPo);
            setMatchPromptSlipId(slipId);
            setMatchPromptMode('auto');
          }
        }
        await load();
        await refreshProjects();
      } catch (e) {
        setUploadError(e.message || 'Upload failed.');
      } finally {
        setUploading(false);
      }
    },
    [selectedProjectId, apiSession, defaultLocation, loadSlipItems, load, refreshProjects],
  );

  const fetchUnmatchedPos = useCallback(async () => {
    if (!apiSession || selectedProjectId == null) { setUnmatchedPos([]); return; }
    try {
      const data = await apiFetch(
        `/api/purchase-orders/unmatched?projectId=${selectedProjectId}`,
        {},
        apiSession,
      );
      setUnmatchedPos(Array.isArray(data) ? data : []);
    } catch {
      setUnmatchedPos([]);
    }
  }, [apiSession, selectedProjectId]);

  const confirmPoMatch = useCallback(async (slipId, poId) => {
    if (!apiSession) return;
    setMatching(true);
    try {
      await apiFetch(
        `/api/packing-slips/${slipId}/match`,
        { method: 'PATCH', body: { poId } },
        apiSession,
      );
      setMatchPromptSlipId(null);
      setMatchPromptMode(null);
      setSuggestedMatchPo(null);
      await load();
    } catch (e) {
      Alert.alert('Match Error', e.message || 'Could not link to PO.');
    } finally {
      setMatching(false);
    }
  }, [apiSession, load]);

  const clearPoMatch = useCallback(async (slipId) => {
    if (!apiSession) return;
    try {
      await apiFetch(
        `/api/packing-slips/${slipId}/match`,
        { method: 'PATCH', body: { poId: null } },
        apiSession,
      );
      await load();
    } catch { /* ignore */ }
  }, [apiSession, load]);

  const dismissMatchPrompt = useCallback(() => {
    setMatchPromptSlipId(null);
    setMatchPromptMode(null);
    setSuggestedMatchPo(null);
  }, []);

  const showManualPicker = useCallback(async () => {
    setMatchPromptMode('manual');
    await fetchUnmatchedPos();
  }, [fetchUnmatchedPos]);

  const scanAndUpload = useCallback(async () => {
    setUploadError('');
    if (selectedProjectId == null) { setUploadError('Select a job on the Dashboard first.'); return; }
    
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setUploadError('Camera permission is required.'); return; }
    
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets?.[0]) return;
    
    await processAndUploadImage(result.assets[0].uri, result.assets[0].mimeType);
  }, [selectedProjectId, processAndUploadImage]);

  const pickAndUploadPDF = useCallback(async () => {
    setUploadError('');
    if (selectedProjectId == null) { setUploadError('Select a job on the Dashboard first.'); return; }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      setUploading(true);
      const form = new FormData();
      form.append('projectId', String(selectedProjectId));
      form.append('photo', {
        uri: result.assets[0].uri,
        name: result.assets[0].name || 'slip.pdf',
        type: result.assets[0].mimeType || 'application/pdf',
      });

      const slipData = await apiFetch('/api/packing-slips', { method: 'POST', body: form, timeoutMs: 120_000 }, apiSession);
      const slipId = slipData?.id;
      if (slipId) {
        const suggestions = Array.isArray(slipData.suggestedItems) ? slipData.suggestedItems : [];
        if (suggestions.length > 0) {
          setSuggestedItems((prev) => ({ ...prev, [slipId]: suggestions }));
        }
        await loadSlipItems(slipId);
        setLineItemError('');
        setEditingSlipId(slipId);
        if (suggestions.length > 0) {
          setLineItems(
            suggestions.map((it) => ({
              description: it.description || '',
              quantity_received: String(it.quantity_received ?? 0),
              location: defaultLocation,
            })),
          );
        } else {
          setLineItems([{ description: '', quantity_received: '0', location: defaultLocation }]);
        }

        // Handle PO matching suggestion
        if (slipData.suggestedMatchPo) {
          setSuggestedMatchPo(slipData.suggestedMatchPo);
          setMatchPromptSlipId(slipId);
          setMatchPromptMode('auto');
        }
      }
      await load();
      await refreshProjects();
    } catch (e) {
      setUploadError(e.message || 'PDF upload failed.');
    } finally {
      setUploading(false);
    }
  }, [selectedProjectId, apiSession, defaultLocation, loadSlipItems, load, refreshProjects]);

  const confirmDeleteSlip = useCallback((slipId) => {
    Alert.alert('Delete photo', 'Remove this packing slip and its data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/packing-slips/${slipId}`, { method: 'DELETE' }, apiSession);
            if (editingSlipId === slipId) {
              setEditingSlipId(null);
              setLineItems([{ description: '', quantity_received: '0', location: defaultLocation }]);
            }
            await load();
            await loadShortages();
            await loadInventoryLocations();
            await refreshProjects();
          } catch { /* ignore */ }
        },
      },
    ]);
  }, [apiSession, editingSlipId, defaultLocation, load, loadShortages, loadInventoryLocations, refreshProjects]);

  return {
    slips,
    loading,
    error,
    canUpload,
    canAddItems,
    needsProject: selectedProjectId == null,
    uploadError,
    uploading,
    scanAndUpload,
    pickAndUploadPDF,
    confirmDeleteSlip,
    reload: load,
    getSlipImageSource,
    shortages,
    shortageLoading,
    editingSlipId,
    toggleEditSlip,
    lineItems,
    addLineItem,
    updateLineItem,
    removeLineItem,
    locationOptions,
    lineItemError,
    submitLineItems,
    existingItems,
    getPlacementsForDescription,
    loadSlipItems,
    // PO matching
    matchPromptSlipId,
    suggestedMatchPo,
    unmatchedPos,
    matchPromptMode,
    matching,
    confirmPoMatch,
    clearPoMatch,
    dismissMatchPrompt,
    showManualPicker,
  };
}
