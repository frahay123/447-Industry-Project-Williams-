import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { apiFetch } from '../../api/client';
import { getApiBaseUrl } from '../../config/api';
import { canCreatePO } from '../../permissions';

export function usePurchaseOrders() {
  const { session, apiSession } = useAuth();
  const { selectedProjectId } = useProject();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [poNumber, setPoNumber] = useState('');
  const [vendor, setVendor] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: '1', unit: 'each', price: '' }]);
  const [poImageUri, setPoImageUri] = useState(null);
  const [poImageMime, setPoImageMime] = useState(null);
  const [saveError, setSaveError] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const [expandedHasImage, setExpandedHasImage] = useState(false);
  const [expandedS3Key, setExpandedS3Key] = useState(null);
  const [expandedLinkedSlips, setExpandedLinkedSlips] = useState([]);

  // Extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractionNotes, setExtractionNotes] = useState('');

  // Manual slip linking state
  const [matchPromptPoId, setMatchPromptPoId] = useState(null);
  const [availableSlips, setAvailableSlips] = useState([]);
  const [matching, setMatching] = useState(false);

  const canCreate = canCreatePO(session?.roleId);
  const isPM = session?.roleId === 2;

  const poImageHeaders = useMemo(
    () => ({
      'X-User-Name': session?.username ?? '',
      'X-User-Role': session?.roleId ?? '',
    }),
    [session?.username, session?.roleId],
  );

  const getPoImageSource = useCallback(
    (poId) => ({
      uri: `${getApiBaseUrl()}/api/purchase-orders/${poId}/image`,
      headers: poImageHeaders,
    }),
    [poImageHeaders],
  );

  const load = useCallback(async () => {
    if (!apiSession) { setLoading(false); return; }
    if (selectedProjectId == null) {
      setPos([]);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch(
        `/api/purchase-orders?projectId=${selectedProjectId}`,
        {},
        apiSession,
      );
      setPos(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(e.message || 'Failed to load POs.');
      setPos([]);
    } finally {
      setLoading(false);
    }
  }, [apiSession, selectedProjectId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [selectedProjectId, load]);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { description: '', quantity: '1', unit: 'each', price: '' }]);
  }, []);

  const updateItem = useCallback((index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }, []);

  const removeItem = useCallback((index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const pickPoImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setPoImageUri(result.assets[0].uri);
    setPoImageMime(result.assets[0].mimeType || 'image/jpeg');
  }, []);

  const clearPoImage = useCallback(() => {
    setPoImageUri(null);
    setPoImageMime(null);
  }, []);

  // ── PDF extraction (Bedrock Nova) ───────────────────────────────────────
  const pickAndExtractPDF = useCallback(async () => {
    setExtractError('');
    setExtractionNotes('');

    if (selectedProjectId == null) {
      setExtractError('Select a job on the Dashboard first.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      setExtracting(true);

      const form = new FormData();
      for (const asset of result.assets) {
        form.append('files', {
          uri: asset.uri,
          name: asset.name || 'document.pdf',
          type: asset.mimeType || 'application/pdf',
        });
      }

      // Attach the first picked document as the PO image/document
      setPoImageUri(result.assets[0].uri);
      setPoImageMime(result.assets[0].mimeType || 'application/pdf');

      const data = await apiFetch(
        '/api/purchase-orders/extract',
        { method: 'POST', body: form, timeoutMs: 120_000 },
        apiSession,
      );

      // Pre-fill form fields from extraction result
      if (data.suggestedPoNumber) setPoNumber(data.suggestedPoNumber);
      if (data.suggestedVendor) setVendor(data.suggestedVendor);
      if (data.suggestedTotalPrice != null) setTotalPrice(String(data.suggestedTotalPrice));
      if (Array.isArray(data.suggestedItems) && data.suggestedItems.length > 0) {
        setItems(
          data.suggestedItems.map((it) => ({
            description: it.description || '',
            quantity: String(it.quantity || 1),
            unit: it.unit || 'each',
            price: it.unit_price != null ? String(it.unit_price) : '',
          })),
        );
      }
      if (data.extractionNotes) setExtractionNotes(data.extractionNotes);
    } catch (e) {
      setExtractError(e.message || 'PDF extraction failed.');
    } finally {
      setExtracting(false);
    }
  }, [selectedProjectId, apiSession]);

  const submitPO = useCallback(async () => {
    setSaveError('');
    if (selectedProjectId == null) {
      setSaveError('Select a job on the Dashboard first.');
      return;
    }
    if (!poNumber.trim()) {
      setSaveError('PO number is required.');
      return;
    }
    const validItems = items.filter((it) => it.description.trim());
    if (validItems.length === 0) {
      setSaveError('Add at least one line item.');
      return;
    }
    try {
      const poData = await apiFetch(
        '/api/purchase-orders',
        {
          method: 'POST',
          body: {
            projectId: selectedProjectId,
            poNumber: poNumber.trim(),
            vendor: vendor.trim() || undefined,
            totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
            items: validItems.map((it) => ({
              description: it.description.trim(),
              quantity: parseInt(it.quantity, 10) || 1,
              unit: it.unit.trim() || 'each',
              unit_price: it.price ? parseFloat(it.price) || null : null,
            })),
          },
        },
        apiSession,
      );

      if (poImageUri && poData?.id) {
        const ext = poImageMime?.includes('png') ? 'png' : 'jpg';
        const form = new FormData();
        form.append('photo', {
          uri: poImageUri,
          name: `po.${ext}`,
          type: poImageMime || 'image/jpeg',
        });
        await apiFetch(
          `/api/purchase-orders/${poData.id}/image`,
          { method: 'POST', body: form },
          apiSession,
        );
      }

      setPoNumber('');
      setVendor('');
      setTotalPrice('');
      setItems([{ description: '', quantity: '1', unit: 'each', price: '' }]);
      setPoImageUri(null);
      setPoImageMime(null);
      setExtractionNotes('');
      await load();
    } catch (e) {
      setSaveError(e.message || 'Could not create PO.');
    }
  }, [poNumber, vendor, totalPrice, items, poImageUri, poImageMime, selectedProjectId, apiSession, load]);

  const toggleExpand = useCallback(async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedItems([]);
      setExpandedHasImage(false);
      return;
    }
    try {
      const data = await apiFetch(`/api/purchase-orders/${id}`, {}, apiSession);
      setExpandedId(id);
      setExpandedItems(data.items || []);
      setExpandedHasImage(!!data.s3_key);
      setExpandedS3Key(data.s3_key || null);
      setExpandedLinkedSlips(data.linkedSlips || []);
    } catch {
      setExpandedId(null);
      setExpandedItems([]);
      setExpandedHasImage(false);
      setExpandedS3Key(null);
      setExpandedLinkedSlips([]);
    }
  }, [expandedId, apiSession]);

  const confirmDeletePoImage = useCallback((id) => {
    Alert.alert('Delete image', 'Remove the attached PO document photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/purchase-orders/${id}/image`, { method: 'DELETE' }, apiSession);
            setExpandedHasImage(false);
            await load();
          } catch { /* ignore */ }
        },
      },
    ]);
  }, [apiSession, load]);

  const confirmDeletePO = useCallback((id) => {
    Alert.alert('Delete PO', 'Remove this purchase order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/purchase-orders/${id}`, { method: 'DELETE' }, apiSession);
            if (expandedId === id) { setExpandedId(null); setExpandedItems([]); setExpandedHasImage(false); }
            await load();
          } catch { /* ignore */ }
        },
      },
    ]);
  }, [apiSession, expandedId, load]);

  const cancelPo = useCallback(async (id) => {
    Alert.alert('Cancel PO', 'Are you sure you want to cancel this PO? This action cannot be undone.', [
      { text: 'Keep Open', style: 'cancel' },
      {
        text: 'Cancel PO',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/purchase-orders/${id}/cancel`, { method: 'PATCH' }, apiSession);
            await load();
          } catch (e) {
            Alert.alert('Error', e.message || 'Could not cancel PO.');
          }
        },
      },
    ]);
  }, [apiSession, load]);

  const setBackorderDate = useCallback((poId, liId) => {
    Alert.prompt(
      'Set Backorder Date',
      'Enter expected delivery date (YYYY-MM-DD), or leave blank to clear:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (dateStr) => {
            try {
              await apiFetch(`/api/purchase-orders/${poId}/line-items/${liId}/backorder`, {
                method: 'PATCH',
                body: { backorderDate: dateStr?.trim() || null },
              }, apiSession);
              // reload PO detail
              if (expandedId === poId) {
                const data = await apiFetch(`/api/purchase-orders/${poId}`, {}, apiSession);
                setExpandedItems(data.items || []);
              }
              await load();
            } catch (e) {
              Alert.alert('Error', e.message || 'Could not update backorder date.');
            }
          },
        },
      ],
      'plain-text'
    );
  }, [apiSession, expandedId, load]);

  const requestAmendQty = useCallback((poId, liId, currentQty) => {
    Alert.prompt(
      'Amend Quantity',
      `Current quantity is ${currentQty}. Enter new requested quantity:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Amend',
          onPress: async (qtyStr) => {
            const newQty = parseInt(qtyStr, 10);
            if (!newQty || newQty <= 0) {
              Alert.alert('Error', 'Invalid quantity.');
              return;
            }
            try {
              await apiFetch(`/api/po-line-items/${liId}`, {
                method: 'PUT',
                body: { quantity: newQty },
              }, apiSession);
              Alert.alert('Success', 'Quantity amended.');
              load();
            } catch (e) {
              Alert.alert('Error', e.message || 'Could not update quantity.');
            }
          },
        },
      ],
      'plain-text',
      String(currentQty)
    );
  }, [apiSession, selectedProjectId]);

  const requestMarkFinal = useCallback((poId, liId) => {
    Alert.alert(
      'Mark as Final',
      'Request PM to mark this line item as final? (Closes it even if not fully delivered)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              await apiFetch('/api/po-change-requests', {
                method: 'POST',
                body: {
                  projectId: selectedProjectId,
                  purchaseOrderId: poId,
                  poLineItemId: liId,
                  requestType: 'close_line_early',
                },
              }, apiSession);
              Alert.alert('Success', 'Request sent to PM.');
            } catch (e) {
              Alert.alert('Error', e.message || 'Could not submit request.');
            }
          },
        },
      ]
    );
  }, [apiSession, selectedProjectId]);

  const showManualPicker = useCallback(async (poId) => {
    setMatchPromptPoId(poId);
    if (!apiSession || selectedProjectId == null) { setAvailableSlips([]); return; }
    try {
      const data = await apiFetch(`/api/packing-slips?projectId=${selectedProjectId}`, {}, apiSession);
      setAvailableSlips(Array.isArray(data) ? data : []);
    } catch {
      setAvailableSlips([]);
    }
  }, [apiSession, selectedProjectId]);

  const dismissMatchPrompt = useCallback(() => {
    setMatchPromptPoId(null);
  }, []);

  const confirmSlipMatch = useCallback(async (slipId) => {
    if (!apiSession || !matchPromptPoId) return;
    setMatching(true);
    try {
      await apiFetch(
        `/api/packing-slips/${slipId}/match`,
        { method: 'PATCH', body: { poId: matchPromptPoId } },
        apiSession,
      );
      setMatchPromptPoId(null);
      await load();
      // Also reload expanded linked slips if this is the expanded PO
      if (expandedId === matchPromptPoId) {
        const data = await apiFetch(`/api/purchase-orders/${expandedId}`, {}, apiSession);
        setExpandedLinkedSlips(data.linked_slips || []);
      }
    } catch (e) {
      Alert.alert('Match Error', e.message || 'Could not link to delivery slip.');
    } finally {
      setMatching(false);
    }
  }, [apiSession, matchPromptPoId, load, expandedId]);

  return {
    pos,
    loading,
    error,
    canCreate,
    needsProject: selectedProjectId == null,
    poNumber,
    setPoNumber,
    vendor,
    setVendor,
    totalPrice,
    setTotalPrice,
    items,
    addItem,
    updateItem,
    removeItem,
    poImageUri,
    poImageMime,
    pickPoImage,
    clearPoImage,
    saveError,
    submitPO,
    expandedId,
    expandedItems,
    expandedHasImage,
    expandedS3Key,
    expandedLinkedSlips,
    getPoImageSource,
    toggleExpand,
    confirmDeletePO,
    confirmDeletePoImage,
    reload: load,
    // Extraction
    extracting,
    extractError,
    extractionNotes,
    pickAndExtractPDF,
    cancelPo,
    setBackorderDate,
    requestAmendQty,
    requestMarkFinal,
    isPM,
    matchPromptPoId,
    availableSlips,
    matching,
    showManualPicker,
    dismissMatchPrompt,
    confirmSlipMatch,
  };
}
