import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './TransfersScreen.styles';
import { useTransfers } from './TransfersScreen.logic';
import { EmptyState } from '../../components/EmptyState';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

const STATUS_ORDER = ['pending', 'manifested', 'in_transit', 'delivered'];

const NEXT_STATUS = {
  pending: 'manifested',
  manifested: 'in_transit',
  in_transit: 'delivered',
};

const NEXT_LABEL = {
  pending: 'Mark Manifested',
  manifested: 'Mark In Transit',
  in_transit: 'Mark Delivered',
};

function StatusTrack({ status }) {
  const idx = STATUS_ORDER.indexOf(status);
  return (
    <>
      <View style={styles.statusTrack}>
        {STATUS_ORDER.map((step, i) => (
          <View
            key={step}
            style={[
              styles.statusStep,
              i < idx && styles.statusStepDone,
              i === idx && styles.statusStepActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.statusLabel}>{status.replace('_', ' ')}</Text>
    </>
  );
}

function LocationChips({ label, selectedKey, onSelectChip, chips }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipWrap}>
        {chips.map((c, idx) => {
          const chipKey = `${c.projectId}-${c.label}-${idx}`;
          const active = chipKey === selectedKey;
          return (
            <Pressable
              key={`${c.label}-${idx}`}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() =>
                onSelectChip(active ? null : { chipKey, projectId: c.projectId })
              }
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {c.label}
              </Text>
              {c.sub ? (
                <Text
                  style={[styles.chipSub, active && styles.chipSubActive]}
                >
                  {c.sub}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TransfersScreen() {
  const {
    transfers,
    loading,
    error,
    canCreate,
    canAdvance,
    description,
    setDescription,
    quantity,
    setQuantity,
    notes,
    setNotes,
    fromProjectId,
    setFromProjectId,
    toProjectId,
    setToProjectId,
    projects,
    locationChips,
    saveError,
    submitTransfer,
    advanceStatus,
    reload,
  } = useTransfers();
  const [fromSelectedKey, setFromSelectedKey] = useState(null);
  const [toSelectedKey, setToSelectedKey] = useState(null);

  useEffect(() => {
    if (!fromProjectId) setFromSelectedKey(null);
  }, [fromProjectId]);

  useEffect(() => {
    if (!toProjectId) setToSelectedKey(null);
  }, [toProjectId]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Transfers</Text>

        {error ? <Text style={styles.msg}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {canCreate ? (
          <>
            <Text style={styles.formTitle}>New transfer</Text>

            <LocationChips
              label="From"
              selectedKey={fromSelectedKey}
              onSelectChip={(chip) => {
                if (!chip) {
                  setFromSelectedKey(null);
                  setFromProjectId(null);
                  return;
                }
                setFromSelectedKey(chip.chipKey);
                setFromProjectId(chip.projectId);
              }}
              chips={locationChips}
            />

            <LocationChips
              label="To"
              selectedKey={toSelectedKey}
              onSelectChip={(chip) => {
                if (!chip) {
                  setToSelectedKey(null);
                  setToProjectId(null);
                  return;
                }
                setToSelectedKey(chip.chipKey);
                setToProjectId(chip.projectId);
              }}
              chips={locationChips}
            />

            <Text style={styles.label}>Material</Text>
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
            <Pressable style={styles.submit} onPress={submitTransfer}>
              <Text style={styles.submitText}>Submit transfer</Text>
            </Pressable>
          </>
        ) : null}

        <Text style={styles.formTitle}>All transfers</Text>

        {!loading && transfers.length === 0 ? (
          <EmptyState title="No transfers" />
        ) : null}

        {transfers.map((t) => {
          const nextStatus = NEXT_STATUS[t.status];
          const nextLabel = NEXT_LABEL[t.status];

          return (
            <View key={t.id} style={styles.card}>
              <Text style={styles.rowTitle}>{t.description}</Text>
              <Text style={styles.rowMeta}>Qty {t.quantity}</Text>
              <View style={styles.directionRow}>
                <Text style={styles.directionFrom}>
                  {t.source_project_name || '—'}
                </Text>
                <Text style={styles.directionArrow}> → </Text>
                <Text style={styles.directionTo}>
                  {t.project_name || '—'}
                </Text>
              </View>
              <Text style={styles.rowMeta}>By {t.requested_by}</Text>

              <StatusTrack status={t.status} />

              {t.status === 'delivered' && t.signed_by ? (
                <Text style={styles.signedInfo}>
                  Signed by {t.signed_by}
                  {t.delivered_at
                    ? ` · ${new Date(t.delivered_at).toLocaleString()}`
                    : ''}
                </Text>
              ) : null}

              {canAdvance && nextStatus ? (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => advanceStatus(t.id, nextStatus)}
                  >
                    <Text style={styles.actionBtnText}>{nextLabel}</Text>
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
