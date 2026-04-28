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
  const [lineItems, setLineItems] = useState([{ description: '', quantity_received: '0', location: '', po_line_item_id: null, issue_flag: false, issue_message: '' }]);
  const [lineItemError, setLineItemError] = useState('');
  const [existingItems, setExistingItems] = useState({});
  const [poItems, setPoItems] = useState([]);

  // Extraction state (suggested items from Bedrock on upload)
  const [suggestedItems, setSuggestedItems] = useState({});

  // PO matching state
  const [matchPromptSlipId, setMatchPromptSlipId] = useState(null);
  const [unmatchedPos, setUnmatchedPos] = useState([]);
  const [matching, setMatching] = useState(false);

  // Reverse-link state: picking a slip to attach to a PO (from shortage section)
  const [linkPoPickerPoId, setLinkPoPickerPoId] = useState(null);
  const [availableSlipsForPo, setAvailableSlipsForPo] = useState([]);

  // Activity Log
  const [activities, setActivities] = useState([]);
  const [slipActivities, setSlipActivities] = useState({}); // { slipId: [acts] }

  // Shipment upload parameters
  const [shipmentNumber, setShipmentNumber] = useState('1');
  const [expectedShipments, setExpectedShipments] = useState('1');

  const canUpload = canUploadPackingSlip(session?.roleId);
  const canAddItems = canAddDeliveryItems(session?.roleId);
  const isPM = session?.roleId === 2;
  const isWarehouse = session?.roleId === 4;

  const canDeleteSlip = useCallback((slip) => {
    return isPM && !slip.signed_by;
  }, [isPM]);

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
      const activitiesData = await apiFetch(`/api/projects/${selectedProjectId}/activities`, {}, apiSession).catch(() => []);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);

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
      
      const slip = slips.find(s => s.id === slipId);
      if (slip?.linked_pos && slip.linked_pos.length > 0) {
        const allItems = [];
        for (const poLink of slip.linked_pos) {
          try {
            const poData = await apiFetch(`/api/purchase-orders/${poLink.id}`, {}, apiSession);
            if (poData.items) {
              allItems.push(...poData.items.map(it => ({ ...it, po_number: poLink.po_number, po_id: poLink.id })));
            }
          } catch { /* ignore individual fail */ }
        }
        setPoItems(allItems);
      } else {
        setPoItems([]);
      }
    } catch { /* ignore */ }
  }, [apiSession, slips]);

  const loadSlipActivities = useCallback(async (slipId) => {
    if (!apiSession) return;
    try {
      const data = await apiFetch(`/api/packing-slips/${slipId}/activities`, {}, apiSession);
      setSlipActivities(prev => ({ ...prev, [slipId]: Array.isArray(data) ? data : [] }));
    } catch { /* ignore */ }
  }, [apiSession]);

  const toggleEditSlip = useCallback(async (slipId) => {
    if (editingSlipId === slipId) {
      setEditingSlipId(null);
      setLineItems([{ description: '', quantity_received: '0', location: defaultLocation, po_line_item_id: null }]);
      return;
    }
    setEditingSlipId(slipId);
    setLineItemError('');

    // Await the items load so we can read the fresh data
    let loaded = [];
    try {
      const items = await apiFetch(`/api/packing-slips/${slipId}/items`, {}, apiSession);
      loaded = Array.isArray(items) ? items : [];
      setExistingItems((prev) => ({ ...prev, [slipId]: loaded }));

      const slip = slips.find(s => s.id === slipId);
      if (slip?.linked_pos && slip.linked_pos.length > 0) {
        const allItems = [];
        for (const poLink of slip.linked_pos) {
          try {
            const poData = await apiFetch(`/api/purchase-orders/${poLink.id}`, {}, apiSession);
            if (poData.items) {
              allItems.push(...poData.items.map(it => ({ ...it, po_number: poLink.po_number, po_id: poLink.id })));
            }
          } catch { /* ignore individual fail */ }
        }
        setPoItems(allItems);
      } else {
        setPoItems([]);
      }
    } catch { /* ignore */ }

    // Pre-fill from suggested items if available and no existing items yet
    const suggestions = suggestedItems[slipId];

    if (loaded.length > 0) {
      setLineItems(
        loaded.map((it) => ({
          description: it.description || '',
          quantity_received: String(it.quantity_received || 0),
          location: it.location || defaultLocation,
          po_line_item_id: it.po_line_item_id || null,
          damage_qty: String(it.damage_qty || 0),
          damage_notes: it.damage_notes || '',
          issue_type: it.issue_type || null,
          issue_notes: it.issue_notes || '',
        }))
      );
    } else if (Array.isArray(suggestions) && suggestions.length > 0) {
      setLineItems(
        suggestions.map((it) => {
          return {
            description: it.description || '',
            quantity_received: String(it.quantity_received || 0),
            location: defaultLocation,
            po_line_item_id: null,
          };
        }),
      );
    } else {
      setLineItems([{ description: '', quantity_received: '0', location: defaultLocation, po_line_item_id: null, damage_qty: '0', damage_notes: '', issue_type: null, issue_notes: '' }]);
    }
  }, [editingSlipId, apiSession, defaultLocation, suggestedItems, slips]);

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, { description: '', quantity_received: '0', location: defaultLocation, po_line_item_id: null, damage_qty: '0', damage_notes: '', issue_type: null, issue_notes: '' }]);
  }, [defaultLocation]);

  const updateLineItem = useCallback((index, field, value) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      // Auto-fill description if a PO line item is selected and description is empty
      if (field === 'po_line_item_id' && value && !copy[index].description.trim()) {
        const poItem = poItems.find(p => p.id === value);
        if (poItem) {
          copy[index].description = poItem.description;
        }
      }
      return copy;
    });
  }, [poItems]);

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
              po_line_item_id: it.po_line_item_id,
              issue_flag: !!it.issue_flag,
              issue_message: it.issue_message || '',
            })),
          },
        },
        apiSession,
      );
      await loadSlipItems(editingSlipId);
      setLineItems([{ description: '', quantity_received: '0', location: defaultLocation, po_line_item_id: null, issue_flag: false, issue_message: '' }]);
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
        form.append('shipmentNumber', shipmentNumber);
        form.append('expectedShipments', expectedShipments);
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

          // After upload, editor modal will open automatically via setEditingSlipId
        }
        await load();
        await refreshProjects();
      } catch (e) {
        if (e.status === 409 || e.message?.includes('duplicate')) {
          Alert.alert(
            '⚠️ Duplicate File',
            'This exact file has already been uploaded for this project. Please verify before proceeding.',
            [{ text: 'OK' }],
          );
        } else {
          setUploadError(e.message || 'Upload failed.');
        }
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
      await load();
    } catch (e) {
      Alert.alert('Match Error', e.message || 'Could not link to PO.');
    } finally {
      setMatching(false);
    }
  }, [apiSession, load]);

  const clearPoMatch = useCallback(async (slipId, poId) => {
    if (!apiSession) return;
    try {
      await apiFetch(
        `/api/packing-slips/${slipId}/match`,
        { method: 'PATCH', body: { poId, unlink: true } },
        apiSession,
      );
      await load();
    } catch { /* ignore */ }
  }, [apiSession, load]);

  const dismissMatchPrompt = useCallback(() => {
    setMatchPromptSlipId(null);
  }, []);

  const showManualPicker = useCallback(async (slipId) => {
    if (slipId) setMatchPromptSlipId(slipId);
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
      form.append('shipmentNumber', shipmentNumber);
      form.append('expectedShipments', expectedShipments);
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
      }
      await load();
      await refreshProjects();
    } catch (e) {
      if (e.status === 409 || e.message?.includes('duplicate')) {
        Alert.alert(
          '⚠️ Duplicate File',
          'This exact file has already been uploaded for this project. Please verify before proceeding.',
          [{ text: 'OK' }],
        );
      } else {
        setUploadError(e.message || 'PDF upload failed.');
      }
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
              setLineItems([{ description: '', quantity_received: '0', location: defaultLocation, damage_qty: '0', damage_notes: '', issue_type: null, issue_notes: '' }]);
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

  const completeSlip = useCallback(async (slipId) => {
    if (!apiSession) return;
    try {
      await apiFetch(`/api/packing-slips/${slipId}/complete`, { method: 'POST' }, apiSession);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to complete slip.');
    }
  }, [apiSession, load]);

  const flagSlipIssue = useCallback((slipId) => {
    Alert.prompt(
      'Flag Slip Issue',
      'Describe the issue with this packing slip. This will start a conversation with the PM.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message) => {
            if (!message?.trim()) return;
            try {
              await apiFetch('/api/issue-threads/from-slip', {
                method: 'POST',
                body: {
                  projectId: selectedProjectId,
                  packingSlipId: slipId,
                  message: message.trim(),
                },
              }, apiSession);
              await load();
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to flag issue.');
            }
          },
        },
      ],
      'plain-text'
    );
  }, [selectedProjectId, apiSession, load]);

  const showSlipPickerForPo = useCallback(async (poId) => {
    setLinkPoPickerPoId(poId);
    if (!apiSession || selectedProjectId == null) { setAvailableSlipsForPo([]); return; }
    try {
      const data = await apiFetch(`/api/packing-slips?projectId=${selectedProjectId}`, {}, apiSession);
      setAvailableSlipsForPo(Array.isArray(data) ? data : []);
    } catch {
      setAvailableSlipsForPo([]);
    }
  }, [apiSession, selectedProjectId]);

  const dismissSlipPicker = useCallback(() => {
    setLinkPoPickerPoId(null);
  }, []);

  const confirmSlipToPo = useCallback(async (slipId) => {
    if (!apiSession || !linkPoPickerPoId) return;
    setMatching(true);
    try {
      await apiFetch(
        `/api/packing-slips/${slipId}/match`,
        { method: 'PATCH', body: { poId: linkPoPickerPoId } },
        apiSession,
      );
      setLinkPoPickerPoId(null);
      await load();
      await loadShortages();
    } catch (e) {
      Alert.alert('Link Error', e.message || 'Could not link slip to PO.');
    } finally {
      setMatching(false);
    }
  }, [apiSession, linkPoPickerPoId, load, loadShortages]);

  const unlinkSlipFromPo = useCallback(async (slipId) => {
    if (!apiSession || !linkPoPickerPoId) return;
    setMatching(true);
    try {
      await apiFetch(
        `/api/packing-slips/${slipId}/match`,
        { method: 'PATCH', body: { poId: linkPoPickerPoId, unlink: true } },
        apiSession,
      );
      setLinkPoPickerPoId(null);
      await load();
      await loadShortages();
    } catch (e) {
      Alert.alert('Unlink Error', e.message || 'Could not unlink slip from PO.');
    } finally {
      setMatching(false);
    }
  }, [apiSession, linkPoPickerPoId, load, loadShortages]);

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
    poItems,
    getPlacementsForDescription,
    loadSlipItems,
    // PO matching
    matchPromptSlipId,
    unmatchedPos,
    matching,
    confirmPoMatch,
    clearPoMatch,
    dismissMatchPrompt,
    showManualPicker,
    shipmentNumber,
    setShipmentNumber,
    expectedShipments,
    setExpectedShipments,
    flagSlipIssue,
    isWarehouse,
    isPM,
    canDeleteSlip,
    completeSlip,
    activities,
    slipActivities,
    loadSlipActivities,
    // Reverse-link (shortage → slip picker)
    linkPoPickerPoId,
    availableSlipsForPo,
    showSlipPickerForPo,
    dismissSlipPicker,
    confirmSlipToPo,
    unlinkSlipFromPo,
    apiSession,
    session,
  };
}
