import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { apiFetch } from '../../api/client';
import { canApprovePoChanges, canSubmitPoChangeRequest } from '../../permissions';

const REQUEST_TYPE_LABELS = {
  amend_line_qty: 'Amend Line Quantity',
  cancel_po: 'Cancel PO',
  close_line_early: 'Close Line Early',
  set_backorder_date: 'Set Backorder Date',
  add_po_link: 'Link Slip to PO',
  reject_slip: 'Reject Delivery',
  set_shipment_count: 'Set Shipment Count',
};

export function usePoRequests() {
  const { session, apiSession } = useAuth();
  const { selectedProjectId } = useProject();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isApprover = canApprovePoChanges(session?.roleId);
  const canSubmit = canSubmitPoChangeRequest(session?.roleId);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const load = useCallback(async () => {
    if (!apiSession || selectedProjectId == null) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(
        `/api/po-change-requests?projectId=${selectedProjectId}`,
        {},
        apiSession,
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, [apiSession, selectedProjectId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [selectedProjectId, load]);

  const approveRequest = useCallback(async (requestId) => {
    try {
      await apiFetch(
        `/api/po-change-requests/${requestId}/approve`,
        { method: 'POST', body: {} },
        apiSession,
      );
      await load();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to approve.');
    }
  }, [apiSession, load]);

  const rejectRequest = useCallback(async (requestId, reviewNotes) => {
    try {
      await apiFetch(
        `/api/po-change-requests/${requestId}/reject`,
        { method: 'POST', body: { reviewNotes } },
        apiSession,
      );
      await load();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to reject.');
    }
  }, [apiSession, load]);

  const promptReject = useCallback((requestId) => {
    Alert.prompt(
      'Reject Request',
      'Optional: enter a note for the requester.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: (note) => rejectRequest(requestId, note) },
      ],
      'plain-text',
      '',
    );
  }, [rejectRequest]);

  return {
    requests,
    loading,
    error,
    isApprover,
    canSubmit,
    pendingCount,
    approveRequest,
    promptReject,
    reload: load,
    requestTypeLabel: (type) => REQUEST_TYPE_LABELS[type] || type,
  };
}
