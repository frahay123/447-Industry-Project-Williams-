import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACTION_LABELS = {
  uploaded: 'Uploaded packing slip',
  items_logged: 'Logged items',
  rejected: 'Rejected delivery',
  linked_po: 'Linked to PO',
  unlinked_po: 'Unlinked from PO',
  deleted: 'Deleted packing slip',
  completed: 'Marked delivery as complete',
};

export default function ActivityLogPanel({ activities = [] }) {
  const [expanded, setExpanded] = useState(false);
  if (!activities || activities.length === 0) return null;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const displayList = expanded ? activities : activities.slice(0, 3);

  return (
    <View style={s.container}>
      <Pressable style={s.headerRow} onPress={toggle}>
        <Text style={s.title}>Recent Activity</Text>
        <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>
      
      <View style={s.timeline}>
        {displayList.map((act, idx) => {
          const isLast = idx === displayList.length - 1;
          const label = ACTION_LABELS[act.action] || act.action;
          const date = new Date(act.created_at);
          
          let details = '';
          if (act.payload) {
            if (act.action === 'items_logged' && act.payload.itemCount !== undefined) {
              details = `Logged ${act.payload.itemCount} item(s)`;
            } else if (act.action === 'linked_po' && act.payload.poId) {
              details = `Linked to PO #${act.payload.poId}`;
            } else if (act.action === 'rejected' && act.payload.reason) {
              details = `Reason: ${act.payload.reason}`;
            }
          }

          return (
            <View key={act.id} style={s.item}>
              <View style={s.dotCol}>
                <View style={s.dot} />
                {!isLast && <View style={s.line} />}
              </View>
              <View style={s.content}>
                <Text style={s.header}>
                  <Text style={s.user}>{act.user_name}</Text> {label}
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
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  user: {
    fontWeight: '700',
    color: '#0f172a',
  },
  details: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontStyle: 'italic',
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});
