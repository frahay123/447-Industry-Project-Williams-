import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_CONFIG = {
  none: { label: 'Not Started', color: '#94a3b8', bg: '#f1f5f9' },
  partial: { label: 'Partial', color: '#d97706', bg: '#fef9c3' },
  complete: { label: 'Complete', color: '#16a34a', bg: '#dcfce7' },
};

/**
 * Shows live per-PO delivery progress based on the current editor state.
 * 
 * @param {Array} poItems - All PO line items (from all linked POs)
 * @param {Array} lineItems - Current editor line items (local state)
 */
export default function POSummaryPanel({ poItems = [], lineItems = [] }) {
  const summary = useMemo(() => {
    if (!poItems.length) return [];

    // Group PO items by po_id
    const poMap = new Map();
    for (const pi of poItems) {
      const key = pi.po_id || pi.purchase_order_id;
      if (!poMap.has(key)) {
        poMap.set(key, {
          poId: key,
          poNumber: pi.po_number,
          poSeq: pi.po_seq,
          items: [],
        });
      }
      poMap.get(key).items.push(pi);
    }

    // Build summary per PO
    const result = [];
    for (const [, po] of poMap) {
      let totalOrdered = 0;
      let totalDelivered = 0;

      for (const item of po.items) {
        totalOrdered += item.quantity || 0;
        // Base: what's already in the DB
        let delivered = item.quantity_delivered || 0;
        // Add from current editor state: find line items matching this PO item
        for (const li of lineItems) {
          if (li.po_line_item_id === item.id && !li.issue_type) {
            delivered += parseInt(li.quantity_received || 0, 10);
          }
        }
        totalDelivered += delivered;
      }

      const remaining = Math.max(0, totalOrdered - totalDelivered);
      const status = totalDelivered === 0 ? 'none'
        : totalDelivered >= totalOrdered ? 'complete'
        : 'partial';

      result.push({
        poId: po.poId,
        label: `PO #${po.poNumber}`,
        totalOrdered,
        totalDelivered: Math.min(totalDelivered, totalOrdered),
        remaining,
        status,
      });
    }

    return result;
  }, [poItems, lineItems]);

  if (summary.length === 0) return null;

  return (
    <View style={s.container}>
      <Text style={s.title}>PO Fulfilment</Text>
      {summary.map((po) => {
        const cfg = STATUS_CONFIG[po.status];
        const pct = po.totalOrdered > 0
          ? Math.round((po.totalDelivered / po.totalOrdered) * 100)
          : 0;
        return (
          <View key={po.poId} style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.poLabel}>{po.label}</Text>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
              </View>
            </View>
            <View style={s.numCol}>
              <Text style={s.nums}>{po.totalDelivered}/{po.totalOrdered}</Text>
              <Text style={s.remaining}>{po.remaining} rem.</Text>
              <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#f0f9ff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e40af',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  poLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  barBg: {
    height: 6,
    backgroundColor: '#e0e7ff',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  numCol: {
    alignItems: 'flex-end',
    marginLeft: 12,
    minWidth: 80,
  },
  nums: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  remaining: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
