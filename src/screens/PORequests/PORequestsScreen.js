import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePoRequests } from './PORequestsScreen.logic';
import { EmptyState } from '../../components/EmptyState';
import IssueDiscussionModal from '../../components/IssueDiscussionModal';

export default function PORequestsScreen() {
  const {
    threads = [],
    loading,
    error,
    isPM,
    reload,
    resolveThread,
    session,
    apiSession
  } = usePoRequests();

  const [activeThread, setActiveThread] = useState(null);

  const openThread = (t) => {
    setActiveThread(t);
  };

  const pending = (threads || []).filter(t => t.status === 'open');
  const resolved = (threads || []).filter(t => t.status === 'resolved');

  return (
    <SafeAreaView style={s.root} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Communications</Text>

        {error ? <Text style={s.errorText}>{error}</Text> : null}
        {loading && <ActivityIndicator style={{ marginVertical: 16 }} />}

        {!loading && threads.length === 0 && (
          <EmptyState title="No communications yet" />
        )}

        {pending.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Active Issues</Text>
            {pending.map(t => (
              <ThreadCard
                key={t.id}
                thread={t}
                onPress={() => openThread(t)}
                onResolve={() => resolveThread(t.id)}
                isPM={isPM}
              />
            ))}
          </>
        )}

        {resolved.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Resolved</Text>
            {resolved.map(t => (
              <ThreadCard
                key={t.id}
                thread={t}
                onPress={() => openThread(t)}
                isPM={isPM}
              />
            ))}
          </>
        )}
      </ScrollView>

      <IssueDiscussionModal
        visible={!!activeThread}
        onClose={() => setActiveThread(null)}
        thread={activeThread}
        user={{
          name: session?.userName || 'User',
          role: session?.roleId === 2 ? 'Project Manager' : 'Warehouse',
          token: apiSession
        }}
      />
    </SafeAreaView>
  );
}

function ThreadCard({ thread: t, onPress, onResolve, isPM }) {
  const isOpen = t.status === 'open';
  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.cardHeader}>
        <Text style={s.cardType}>{t.item_description}</Text>
        <View style={[s.badge, { backgroundColor: isOpen ? '#ebf8ff' : '#f0fff4' }]}>
          <Text style={[s.badgeText, { color: isOpen ? '#3182ce' : '#38a169' }]}>
            {isOpen ? 'ACTIVE' : 'RESOLVED'}
          </Text>
        </View>
      </View>

      <Text style={s.cardMeta}>
        Slip #{t.slip_label || t.packing_slip_id} {t.po_number ? `· PO #${t.po_number}` : ''}
      </Text>

      <Text style={s.cardMeta}>
        Project: <Text style={{ fontWeight: '600' }}>{t.project_name}</Text>
      </Text>

      <View style={s.cardFooter}>
        <Text style={s.messageCount}>
          💬 {t.message_count} message{t.message_count !== 1 ? 's' : ''}
        </Text>
        <Text style={s.timeText}>
          Updated {new Date(t.updated_at).toLocaleDateString()}
        </Text>
      </View>

      {isPM && isOpen && onResolve && (
        <Pressable
          style={s.resolveBtn}
          onPress={(e) => {
            e.stopPropagation();
            onResolve();
          }}
        >
          <Text style={s.resolveBtnText}>Mark as Resolved</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
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
  cardType: { fontSize: 16, fontWeight: '700', color: '#1e293b', flex: 1 },
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  messageCount: { fontSize: 12, fontWeight: '600', color: '#4a5568' },
  timeText: { fontSize: 11, color: '#a0aec0' },
  resolveBtn: {
    marginTop: 12,
    backgroundColor: '#f0fff4',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  resolveBtnText: { color: '#2f855a', fontWeight: '700', fontSize: 12 },
  errorText: { color: '#dc2626', fontSize: 14, marginBottom: 8 },
});
