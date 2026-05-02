import { useState } from 'react';
import { View, Text, Pressable, Image, Linking, StyleSheet } from 'react-native';

import ActivityLogPanel from './ActivityLogPanel';

const ISSUE_TYPES = { WRONG_ITEM: 'Wrong Item', DAMAGED: 'Damaged', MISSING: 'Missing', OVER_DELIVERY: 'Over-delivery' };

export default function DeliveryCard({
  slip,
  existingItems = [],
  onLinkPO,
  onLogItems,
  onReject,
  onDelete,
  onPreview,
  onComplete,
  onOpenMessages,
  canDelete,
  canAddItems,
  getSlipImageSource,
  slipActivities = [],
}) {
  const itemCount = existingItems.length;
  const issueCount = existingItems.filter(it => it.issue_type).length;
  const linkedPos = slip.linked_pos || [];
  const [showActivities, setShowActivities] = useState(false);
  const vendorNames = linkedPos.map(p => p.vendor).filter(Boolean).join(', ');

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.slipNumber}>{vendorNames ? vendorNames : `Slip #${slip.slip_seq}`}</Text>
          <Text style={s.meta}>
            {slip.uploaded_by} · {new Date(slip.created_at).toLocaleDateString()}
          </Text>
        </View>
        {slip.is_rejected ? (
          <View style={s.rejectedBadge}><Text style={s.rejectedText}>Rejected</Text></View>
        ) : slip.signed_by ? (
          <View style={s.signedBadge}><Text style={s.signedText}>Signed</Text></View>
        ) : (
          <View style={s.pendingBadge}><Text style={s.pendingText}>Pending</Text></View>
        )}
      </View>

      {/* Thumbnail */}
      {slip.s3_key && slip.s3_key.endsWith('.pdf') ? (
        <Pressable
          style={s.pdfBtn}
          onPress={() => Linking.openURL(getSlipImageSource(slip.id).uri)}
        >
          <Text style={s.pdfBtnText}>📄 View PDF Document</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => onPreview(slip.id)} style={s.thumbWrap}>
          <Image
            source={getSlipImageSource(slip.id)}
            style={s.thumb}
            resizeMode="cover"
          />
          <Text style={s.thumbHint}>Tap to view full size</Text>
        </Pressable>
      )}

      {/* Linked POs */}
      {linkedPos.length > 0 ? (
        <View style={s.linkedSection}>
          <Text style={s.linkedLabel}>Linked POs</Text>
          <View style={s.linkedRow}>
            {linkedPos.map((po) => (
              <View key={po.id} style={s.poPill}>
                <Text style={s.poPillText}>
                  PO #{po.po_seq} ({po.po_number})
                  {po.vendor ? ` — ${po.vendor}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Summary */}
      <View style={s.summaryRow}>
        <Text style={s.summaryText}>
          {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''} logged` : 'No items logged yet'}
        </Text>
        {issueCount > 0 ? (
          <View style={s.issueBadge}>
            <Text style={s.issueBadgeText}>⚠ {issueCount} issue{issueCount !== 1 ? 's' : ''}</Text>
          </View>
        ) : null}
      </View>

      {/* Shipment info */}
      {slip.expected_shipments > 1 ? (
        <Text style={s.shipmentInfo}>
          📦 Shipment {slip.shipment_number} of {slip.expected_shipments}
        </Text>
      ) : null}

      {/* Activity Log for this slip */}
      {slipActivities.length > 0 ? (
        <View style={{ marginTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Pressable 
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 12 }}
            onPress={() => setShowActivities(!showActivities)}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Slip Activity ({slipActivities.length})</Text>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '700' }}>{showActivities ? '▲ Hide' : '▼ Expand'}</Text>
          </Pressable>
          {showActivities && (
            <View style={{ marginTop: 12 }}>
              <ActivityLogPanel activities={slipActivities} isGlobal={false} />
            </View>
          )}
        </View>
      ) : null}

      {/* Footer actions */}
      <View style={s.footer}>
        {!slip.signed_by && !slip.is_rejected ? (
          <Pressable style={[s.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => onComplete && onComplete(slip.id)}>
            <Text style={[s.actionBtnText, { color: '#fff' }]}>Mark Complete</Text>
          </Pressable>
        ) : null}
        {linkedPos.length === 0 ? (
          <Pressable style={s.actionBtn} onPress={() => onLinkPO && onLinkPO(slip.id)}>
            <Text style={s.actionBtnText}>📎 Link PO</Text>
          </Pressable>
        ) : null}
        {canAddItems ? (
          <Pressable style={[s.actionBtn, s.actionPrimary]} onPress={() => onLogItems(slip.id)}>
            <Text style={[s.actionBtnText, s.actionPrimaryText]}>
              {itemCount > 0 ? 'Edit Items' : 'Log Items'}
            </Text>
          </Pressable>
        ) : null}
        <Pressable style={[s.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => onOpenMessages && onOpenMessages(slip)}>
          <Text style={[s.actionBtnText, { color: '#fff' }]}>Messages</Text>
        </Pressable>
        {canDelete && !slip.signed_by ? (
          <Pressable style={[s.actionBtn, s.actionDanger]} onPress={() => onDelete(slip.id)}>
            <Text style={[s.actionBtnText, s.actionDangerText]}>🗑 Delete</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  slipNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  meta: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  rejectedBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rejectedText: { fontSize: 12, fontWeight: '700', color: '#991b1b' },
  signedBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  signedText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  pendingBadge: { backgroundColor: '#fef9c3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pendingText: { fontSize: 12, fontWeight: '700', color: '#854d0e' },
  thumbWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    maxHeight: 180,
    marginBottom: 12,
  },
  thumb: { width: '100%', height: 160, backgroundColor: '#e2e8f0' },
  thumbHint: { fontSize: 12, color: '#3b82f6', fontWeight: '600', textAlign: 'center', paddingVertical: 6 },
  pdfBtn: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  pdfBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  linkedSection: { marginBottom: 12 },
  linkedLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  linkedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  poPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  poPillText: { fontSize: 12, fontWeight: '600', color: '#1e40af' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: { fontSize: 14, color: '#475569' },
  issueBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  issueBadgeText: { fontSize: 12, fontWeight: '700', color: '#dc2626' },
  shipmentInfo: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  actionPrimary: { backgroundColor: '#3b82f6' },
  actionPrimaryText: { color: '#fff' },
  actionDanger: { backgroundColor: '#fef2f2' },
  actionDangerText: { color: '#991b1b' },
});

