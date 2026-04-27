import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePoRequests } from './PORequestsScreen.logic';
import { EmptyState } from '../../components/EmptyState';

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
  approved: { bg: '#dcfce7', text: '#166534', label: 'Approved' },
  rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
};

export default function PORequestsScreen() {
  const {
    requests,
    loading,
    error,
    isApprover,
    pendingCount,
    approveRequest,
    promptReject,
    reload,
    requestTypeLabel,
  } = usePoRequests();

  const pending = requests.filter(r => r.status === 'pending');
  const reviewed = requests.filter(r => r.status !== 'pending');

  return (
    <SafeAreaView style={s.root} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Requests</Text>
        {isApprover && pendingCount > 0 ? (
          <View style={s.pendingBanner}>
            <Text style={s.pendingBannerText}>
              🔔 {pendingCount} pending request{pendingCount > 1 ? 's' : ''} need your review
            </Text>
          </View>
        ) : null}

        {error ? <Text style={s.errorText}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {!loading && requests.length === 0 ? (
          <EmptyState title={isApprover ? 'No requests yet' : 'No requests submitted'} />
        ) : null}

        {pending.length > 0 ? (
          <>
            <Text style={s.sectionLabel}>Pending</Text>
            {pending.map(r => (
              <RequestCard
                key={r.id}
                request={r}
                isApprover={isApprover}
                onApprove={() => approveRequest(r.id)}
                onReject={() => promptReject(r.id)}
                requestTypeLabel={requestTypeLabel}
              />
            ))}
          </>
        ) : null}

        {reviewed.length > 0 ? (
          <>
            <Text style={s.sectionLabel}>Reviewed</Text>
            {reviewed.map(r => (
              <RequestCard
                key={r.id}
                request={r}
                isApprover={isApprover}
                requestTypeLabel={requestTypeLabel}
              />
            ))}
          </>
        ) : null}

        {error ? (
          <Pressable onPress={reload}>
            <Text style={s.retryText}>Retry</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({ request: r, isApprover, onApprove, onReject, requestTypeLabel }) {
  const sc = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardType}>{requestTypeLabel(r.request_type)}</Text>
        <View style={[s.badge, { backgroundColor: sc.bg }]}>
          <Text style={[s.badgeText, { color: sc.text }]}>{sc.label}</Text>
        </View>
      </View>

      {r.po_number ? (
        <Text style={s.cardMeta}>PO #{r.po_number}</Text>
      ) : null}
      {r.line_description ? (
        <Text style={s.cardMeta}>Line: {r.line_description}</Text>
      ) : null}

      {/* Payload summary */}
      {Object.keys(r.payload || {}).length > 0 ? (
        <View style={s.payloadBox}>
          {Object.entries(r.payload).map(([k, v]) => (
            <Text key={k} style={s.payloadRow}>
              <Text style={s.payloadKey}>{k}:</Text> {String(v)}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={s.cardMeta}>
        Submitted by <Text style={{ fontWeight: '700' }}>{r.requested_by}</Text>
        {' · '}{r.requested_at ? new Date(r.requested_at).toLocaleDateString() : ''}
      </Text>

      {r.reviewed_by ? (
        <Text style={s.cardMeta}>
          Reviewed by {r.reviewed_by}
          {r.review_notes ? ` — "${r.review_notes}"` : ''}
        </Text>
      ) : null}

      {isApprover && r.status === 'pending' ? (
        <View style={s.actionRow}>
          <Pressable style={[s.actionBtn, s.approveBtn]} onPress={onApprove}>
            <Text style={s.approveBtnText}>✓ Approve</Text>
          </Pressable>
          <Pressable style={[s.actionBtn, s.rejectBtn]} onPress={onReject}>
            <Text style={s.rejectBtnText}>✕ Reject</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  pendingBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  pendingBannerText: { color: '#92400e', fontWeight: '700', fontSize: 14 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardType: { fontSize: 15, fontWeight: '700', color: '#1e293b', flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardMeta: { fontSize: 13, color: '#64748b', marginTop: 4 },
  payloadBox: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, marginVertical: 8 },
  payloadRow: { fontSize: 13, color: '#374151', marginBottom: 2 },
  payloadKey: { fontWeight: '700', color: '#0f172a' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  approveBtn: { backgroundColor: '#dcfce7' },
  approveBtnText: { color: '#166534', fontWeight: '700', fontSize: 14 },
  rejectBtn: { backgroundColor: '#fee2e2' },
  rejectBtnText: { color: '#991b1b', fontWeight: '700', fontSize: 14 },
  errorText: { color: '#dc2626', fontSize: 14, marginBottom: 8 },
  retryText: { color: '#3b82f6', fontWeight: '600', marginTop: 8 },
});
