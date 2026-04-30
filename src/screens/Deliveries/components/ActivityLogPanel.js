import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACTION_LABELS = {
  uploaded: 'Uploaded packing slip',
  items_logged: 'Logged items',
  items_edited: 'Edited items post-completion',
  rejected: 'Rejected delivery',
  linked_po: 'Linked to PO',
  unlinked_po: 'Unlinked from PO',
  deleted: 'Deleted packing slip',
  completed: 'Marked delivery as complete',
};

export default function ActivityLogPanel({ activities = [], isGlobal = true }) {
  const [expanded, setExpanded] = useState(isGlobal ? false : true);
  if (!activities || activities.length === 0) return null;

  const toggle = () => {
    if (!isGlobal) return; // Always expanded for per-slip
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const displayList = expanded ? activities : activities.slice(0, 3);

  return (
    <View style={[s.container, !isGlobal && s.containerInline]}>
      {isGlobal && (
        <Pressable style={s.headerRow} onPress={toggle}>
          <Text style={s.title}>Recent Activity</Text>
          <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
        </Pressable>
      )}
      {!isGlobal && <Text style={s.inlineTitle}>Slip Activity</Text>}
      
      <View style={s.timeline}>
        {displayList.map((act, idx) => {
          const isLast = idx === displayList.length - 1;
          const label = ACTION_LABELS[act.action] || act.action;
          const date = new Date(act.created_at);
          
          let details = '';
          if (act.payload) {
            if (act.action === 'items_logged' && act.payload.itemCount !== undefined) {
              const itemsText = act.payload.itemNames ? ` (${act.payload.itemNames})` : '';
              details = `Logged ${act.payload.itemCount} item${act.payload.itemCount !== 1 ? 's' : ''}${itemsText}`;
            } else if (act.action === 'items_edited' && act.payload.itemCount) {
              const itemsText = act.payload.itemNames ? ` (${act.payload.itemNames})` : '';
              details = `Edited ${act.payload.itemCount} item${act.payload.itemCount !== 1 ? 's' : ''}${itemsText}`;
            } else if (act.action === 'linked_po' && act.payload.poId) {
              const poLabel = act.payload.poNum || `#${act.payload.poId}`;
              details = `Linked to PO #${poLabel}`;
            } else if (act.action === 'unlinked_po' && act.payload.poId) {
              const poLabel = act.payload.poNum || `#${act.payload.poId}`;
              details = `Unlinked from PO #${poLabel}`;
            } else if (act.action === 'rejected' && act.payload.reason) {
              details = `Reason: ${act.payload.reason}`;
            }
          }

          const slipNum = act.slip_seq || act.payload?.slipSeq || act.entity_id;
          const slipLabel = (isGlobal && act.entity_type === 'packing_slip') 
            ? `[Slip #${slipNum}] ` 
            : '';

          return (
            <View key={act.id} style={s.item}>
              <View style={s.dotCol}>
                <View style={s.dot} />
                {!isLast && <View style={s.line} />}
              </View>
              <View style={s.content}>
                <Text style={s.header}>
                  {slipLabel}<Text style={s.user}>{act.user_name}</Text> {label}
                </Text>
                {details ? <Text style={s.details}>{details}</Text> : null}
                <Text style={s.time}>
                  {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {!expanded && activities.length > 3 && (
        <Pressable onPress={toggle} style={s.moreBtn}>
          <Text style={s.moreText}>See {activities.length - 3} more...</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chevron: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  moreBtn: {
    marginTop: 8,
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  moreText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  timeline: {
    paddingLeft: 4,
  },
  item: {
    flexDirection: 'row',
  },
  dotCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
    marginBottom: -4,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
  },
  user: {
    fontWeight: '700',
    color: '#0f172a',
  },
  details: {
    fontSize: 14,
    color: '#475569',
    marginTop: 3,
    fontStyle: 'italic',
  },
  time: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  containerInline: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginBottom: 0,
  },
  inlineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
