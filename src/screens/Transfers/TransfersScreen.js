import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './TransfersScreen.styles';
import { useTransfers } from './TransfersScreen.logic';
import { EmptyState } from '../../components/EmptyState';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

const STATUS_ORDER = ['pending', 'manifested', 'in_transit', 'delivered'];

const STATUS_DISPLAY = {
  pending: 'Pending',
  manifested: 'Manifested',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

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

function formatSiteLabel(raw) {
  if (raw == null || String(raw).trim() === '') return '';
  const s = String(raw).trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function StatusTrack({ status }) {
  const idx = STATUS_ORDER.indexOf(status);
  return (
    <View style={{ marginTop: 12 }}>
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        {STATUS_ORDER.map((step, i) => (
          <Text
            key={step}
            style={[
              styles.statusStepLabel,
              i === idx && styles.statusStepLabelActive,
              i < idx && styles.statusStepLabelDone,
            ]}
          >
            {STATUS_DISPLAY[step]}
          </Text>
        ))}
      </View>
    </View>
  );
}

function SiteChips({ title, selectedValue, onSelect, sites }) {
  return (
    <View>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.chipWrap}>
        {sites.map((c) => {
          const active = selectedValue === c.value;
          return (
            <Pressable
              key={c.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(active ? null : c.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {c.label}
              </Text>
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
    needsProject,
    description,
    setDescription,
    quantity,
    setQuantity,
    unit,
    setUnit,
    notes,
    setNotes,
    fromLocation,
    setFromLocation,
    toLocation,
    setToLocation,
    transferSites,
    inventoryAtFrom,
    saveError,
    submitTransfer,
    advanceStatus,
    reload,
  } = useTransfers();

  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Transfers</Text>

        {error ? <Text style={styles.msg}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {canCreate ? (
          <>
            <Text style={styles.formTitle}>New transfer</Text>

            {needsProject ? (
              <Text style={styles.msg}>
                Select a job on the Dashboard first. Transfers are only between
                Warehouse and Jobsite for that job.
              </Text>
            ) : (
              <>
                <SiteChips
                  title="From"
                  selectedValue={fromLocation}
                  onSelect={setFromLocation}
                  sites={transferSites}
                />

                <SiteChips
                  title="To"
                  selectedValue={toLocation}
                  onSelect={setToLocation}
                  sites={transferSites}
                />
              </>
            )}

            <Text style={styles.label}>Material</Text>
            <Pressable
              style={[
                styles.input,
                styles.pickerBtn,
                (!fromLocation || needsProject) && { opacity: 0.5 },
              ]}
              onPress={() => fromLocation && !needsProject && setPickerOpen(true)}
              disabled={!fromLocation || needsProject}
            >
              <Text style={description ? styles.pickerBtnText : styles.pickerBtnPlaceholder}>
                {description || (fromLocation ? 'Select item from inventory…' : 'Select a From location first')}
              </Text>
              <Text style={styles.pickerChevron}>▾</Text>
            </Pressable>

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              editable={!needsProject && !!description}
            />
            <Text style={styles.label}>Unit (optional, e.g. ft, units, each)</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="ft, units, each…"
              editable={!needsProject}
            />
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              editable={!needsProject}
            />
            {saveError ? <Text style={styles.msg}>{saveError}</Text> : null}
            <Pressable
              style={[styles.submit, (needsProject || !description) && { opacity: 0.5 }]}
              onPress={submitTransfer}
              disabled={needsProject || !description}
            >
              <Text style={styles.submitText}>Submit transfer</Text>
            </Pressable>
          </>
        ) : null}

        <Text style={styles.formTitle}>All transfers</Text>

        {!loading && transfers.length === 0 ? (
          <EmptyState
            title={needsProject ? 'No job selected' : 'No transfers'}
            body={
              needsProject
                ? 'Choose a project on the Dashboard to see transfers for that job.'
                : undefined
            }
          />
        ) : null}

        {transfers.map((t) => {
          const nextStatus = NEXT_STATUS[t.status];
          const nextLabel = NEXT_LABEL[t.status];

          const fromDisp = t.source_location
            ? formatSiteLabel(t.source_location)
            : (t.source_project_name || '—');
          const toDisp = t.dest_location
            ? formatSiteLabel(t.dest_location)
            : (t.project_name || '—');

          return (
            <View key={t.id} style={styles.card}>
              <Text style={styles.rowTitle}>{t.description}</Text>
              <Text style={styles.rowMeta}>
                Qty {t.quantity}{t.unit ? ` ${t.unit}` : ''}
              </Text>
              <View style={styles.directionRow}>
                <Text style={styles.directionFrom}>
                  {fromDisp}
                </Text>
                <Text style={styles.directionArrow}> → </Text>
                <Text style={styles.directionTo}>
                  {toDisp}
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

      {/* ── Inventory item picker ── */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} edges={['top', 'bottom']}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: 80 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a' }}>
                Items at {fromLocation}
              </Text>
              <Pressable onPress={() => setPickerOpen(false)}>
                <Text style={{ fontSize: 15, color: '#3b82f6', fontWeight: '600' }}>Cancel</Text>
              </Pressable>
            </View>

            {inventoryAtFrom.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center' }}>
                  No items with stock at {fromLocation}.
                </Text>
              </View>
            ) : (
              <FlatList
                data={inventoryAtFrom}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ padding: 12 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={{
                      padding: 14,
                      backgroundColor: description === item.description ? '#eff6ff' : '#f8fafc',
                      borderRadius: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: description === item.description ? '#bfdbfe' : '#e2e8f0',
                    }}
                    onPress={() => {
                      setDescription(item.description);
                      setQuantity(String(item.quantity));
                      if (item.unit) setUnit(item.unit);
                      setPickerOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
                      {item.description}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                      Available: {item.quantity}
                    </Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
