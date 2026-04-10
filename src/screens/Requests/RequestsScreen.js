import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './RequestsScreen.styles';
import { useRequests } from './RequestsScreen.logic';
import { EmptyState } from '../../components/EmptyState';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

const STATUS_STYLE = {
  pending: { bg: '#fef3c7', text: '#d97706' },
  approved: { bg: '#dcfce7', text: '#16a34a' },
  denied: { bg: '#fee2e2', text: '#dc2626' },
};

export default function RequestsScreen() {
  const {
    requests,
    loading,
    error,
    canCreate,
    canApprove,
    needsProject,
    description,
    setDescription,
    quantity,
    setQuantity,
    notes,
    setNotes,
    saveError,
    submitRequest,
    setStatus,
    reload,
  } = useRequests();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Requests</Text>

        {needsProject ? <EmptyState title="Pick a job" /> : null}

        {error ? <Text style={styles.msg}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {canCreate && !needsProject ? (
          <>
            <Text style={styles.formTitle}>New request</Text>
            <Text style={styles.label}>What you need</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Item / material description"
            />
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
            />
            {saveError ? <Text style={styles.msg}>{saveError}</Text> : null}
            <Pressable style={styles.submit} onPress={submitRequest}>
              <Text style={styles.submitText}>Submit request</Text>
            </Pressable>
          </>
        ) : null}

        <Text style={styles.formTitle}>Requests (this job)</Text>

        {!needsProject && !loading && requests.length === 0 ? (
          <EmptyState title="No requests" />
        ) : null}

        {requests.map((r) => {
          const st = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
          return (
            <View key={r.id} style={styles.card}>
              <Text style={styles.rowTitle}>{r.description}</Text>
              <Text style={styles.rowMeta}>
                Qty {r.quantity}
                {r.project_name ? ` · ${r.project_name}` : ''}
              </Text>
              <Text style={styles.rowMeta}>From {r.requested_by}</Text>
              <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                <Text style={[styles.statusText, { color: st.text }]}>
                  {r.status}
                </Text>
              </View>
              {canApprove && r.status === 'pending' ? (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => setStatus(r.id, 'approved')}
                  >
                    <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                      Approve
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.denyBtn]}
                    onPress={() => setStatus(r.id, 'denied')}
                  >
                    <Text style={styles.actionBtnText}>Deny</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}

        {error ? (
          <Pressable onPress={reload}>
            <Text style={{ color: '#3b82f6', marginTop: 12, fontWeight: '600' }}>
              Retry
            </Text>
          </Pressable>
        ) : null}
      </KeyboardSafeScroll>
    </SafeAreaView>
  );
}
