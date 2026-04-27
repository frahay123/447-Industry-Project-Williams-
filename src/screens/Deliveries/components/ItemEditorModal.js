import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from 'react-native';
import LineItemCard from './LineItemCard';
import POSummaryPanel from './POSummaryPanel';

export default function ItemEditorModal({
  visible,
  slip,
  lineItems = [],
  poItems = [],
  locationOptions = [],
  error = '',
  saving = false,
  onUpdate,
  onAdd,
  onRemove,
  onSave,
  onCancel,
}) {
  const insets = useSafeAreaInsets();

  const issueCount = lineItems.filter(it => it.issue_type).length;
  const itemCount = lineItems.filter(it => it.description?.trim()).length;

  const handleSave = () => {
    if (itemCount === 0) {
      Alert.alert('No Items', 'Add at least one item before saving.');
      return;
    }
    onSave();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={onCancel} hitSlop={12}>
            <Text style={s.cancelBtn}>Cancel</Text>
          </Pressable>
          <Text style={s.headerTitle} numberOfLines={1}>
            {slip ? `Slip #${slip.slip_seq}` : 'Edit Items'}
          </Text>
          <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
            <Text style={[s.saveBtn, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>

        {/* Body */}
        <ScrollView
          contentContainerStyle={[s.body, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* PO Summary Panel */}
          <POSummaryPanel poItems={poItems} lineItems={lineItems} />

          {/* Line items */}
          {lineItems.map((item, i) => (
            <LineItemCard
              key={i}
              item={item}
              index={i}
              poItems={poItems}
              locationOptions={locationOptions}
              onUpdate={onUpdate}
              onRemove={onRemove}
              canRemove={lineItems.length > 1}
            />
          ))}

          {/* Add row */}
          <Pressable style={s.addRowBtn} onPress={onAdd}>
            <Text style={s.addRowText}>+ Add Item</Text>
          </Pressable>

          {/* Error message */}
          {error ? <Text style={s.errorText}>{error}</Text> : null}

          {/* Summary footer */}
          {issueCount > 0 ? (
            <View style={s.issueSummary}>
              <Text style={s.issueSummaryText}>
                {issueCount} issue{issueCount !== 1 ? 's' : ''} will be sent to Requests for PM review on save.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Floating save button */}
        <View style={[s.floatSave, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable style={[s.saveButton, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            <Text style={s.saveButtonText}>
              {saving ? 'Saving…' : `Save ${itemCount} Item${itemCount !== 1 ? 's' : ''}`}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cancelBtn: { fontSize: 15, color: '#3b82f6', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  saveBtn: { fontSize: 15, color: '#22c55e', fontWeight: '700' },
  body: { padding: 16 },
  addRowBtn: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  addRowText: { color: '#475569', fontWeight: '700', fontSize: 14 },
  errorText: { color: '#dc2626', fontSize: 14, marginTop: 8, textAlign: 'center' },
  issueSummary: {
    backgroundColor: '#fef9c3',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  issueSummaryText: { fontSize: 13, color: '#92400e', fontWeight: '600', textAlign: 'center' },
  floatSave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#22c55e',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
