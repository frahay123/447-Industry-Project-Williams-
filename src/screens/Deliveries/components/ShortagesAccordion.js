import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ShortagesAccordion({
  shortages = [],
  shortageLoading = false,
  onViewDetail,
  onLinkSlip,
}) {
  const totalShort = shortages.reduce((sum, s) => sum + (s.short > 0 ? s.short : 0), 0);
  const shortCount = shortages.filter(s => s.short > 0).length;
  const [expanded, setExpanded] = useState(shortCount > 0);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  if (shortages.length === 0) return null;

  return (
    <View style={s.container}>
      <Pressable style={s.header} onPress={toggle}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>PO vs Delivered</Text>
          {!expanded ? (
            <Text style={s.subtitle}>
              {shortCount > 0
                ? `${shortCount} item${shortCount !== 1 ? 's' : ''} short (${totalShort} units)`
                : 'All items on track'}
            </Text>
          ) : null}
        </View>
        <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {expanded ? (
        <View style={s.body}>
          {shortages.map((s_item, i) => (
            <View key={i} style={s.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.desc} numberOfLines={2}>{s_item.description}</Text>
                <Pressable onPress={() => onViewDetail(s_item)} hitSlop={8}>
                  <Text style={s.viewMore}>View more</Text>
                </Pressable>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.nums}>{s_item.received}/{s_item.ordered}</Text>
                {s_item.short > 0 ? (
                  <Text style={s.alert}>{s_item.short} short</Text>
                ) : (
                  <Text style={s.ok}>OK</Text>
                )}
                {s_item.purchase_order_id ? (
                  <Pressable onPress={() => onLinkSlip(s_item.purchase_order_id)} hitSlop={8} style={{ marginTop: 4 }}>
                    <Text style={s.linkBtn}>Link Slip</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  chevron: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 8,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  desc: {
    fontSize: 14,
    color: '#334155',
  },
  viewMore: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  nums: {
    fontSize: 13,
    color: '#64748b',
  },
  alert: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '700',
  },
  ok: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '700',
  },
  linkBtn: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
});
