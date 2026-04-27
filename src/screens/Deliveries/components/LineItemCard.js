import { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const ISSUE_TYPE_OPTIONS = [
  { value: 'WRONG_ITEM', label: 'Wrong Item' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'MISSING', label: 'Missing' },
  { value: 'OVER_DELIVERY', label: 'Over-delivery' },
];

const PICKER_STYLE = Platform.OS === 'ios' ? { width: '100%', height: 120 } : { width: '100%' };
const PICKER_ITEM_STYLE = Platform.OS === 'ios' ? { height: 120, fontSize: 14 } : undefined;

export default function LineItemCard({
  item,
  index,
  poItems = [],
  locationOptions = [],
  onUpdate,
  onRemove,
  canRemove = true,
}) {
  const [showDamage, setShowDamage] = useState(
    () => (parseInt(item.damage_qty, 10) || 0) > 0 || !!item.damage_notes?.trim()
  );

  const locVal =
    item.location && locationOptions.some((o) => o.id === item.location)
      ? item.location
      : locationOptions[0]?.id || '';

  const linkedPoItem = item.po_line_item_id
    ? poItems.find(p => p.id === item.po_line_item_id)
    : null;

  const hasDamage = (parseInt(item.damage_qty, 10) || 0) > 0;

  return (
    <View style={s.card}>
      {/* Row 1: Description + Qty + Remove */}
      <View style={s.topRow}>
        <View style={{ flex: 3 }}>
          <Text style={s.fieldLabel}>Description</Text>
          <TextInput
            style={s.input}
            value={item.description}
            onChangeText={(v) => onUpdate(index, 'description', v)}
            placeholder="Item name"
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={s.fieldLabel}>Qty</Text>
          <TextInput
            style={s.input}
            value={item.quantity_received}
            onChangeText={(v) => onUpdate(index, 'quantity_received', v)}
            keyboardType="number-pad"
            placeholder="0"
          />
        </View>
        {canRemove ? (
          <Pressable style={s.removeBtn} onPress={() => onRemove(index)}>
            <Text style={s.removeBtnText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Row 2: Location */}
      <View style={s.fieldRow}>
        <Text style={s.fieldLabel}>Location</Text>
        <View style={s.pickerShell}>
          <Picker
            selectedValue={locVal}
            onValueChange={(v) => onUpdate(index, 'location', v)}
            style={PICKER_STYLE}
            itemStyle={PICKER_ITEM_STYLE}
          >
            {locationOptions.map((opt) => (
              <Picker.Item key={opt.id} label={opt.label} value={opt.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Row 3: PO Item Matcher (only if PO items available) */}
      {poItems.length > 0 ? (
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Matches PO Item</Text>
          <View style={[s.pickerShell, { borderColor: '#3b82f6' }]}>
            <Picker
              selectedValue={item.po_line_item_id}
              onValueChange={(v) => onUpdate(index, 'po_line_item_id', v)}
              style={PICKER_STYLE}
              itemStyle={PICKER_ITEM_STYLE}
            >
              <Picker.Item label="None / Manual Item" value={null} />
              {poItems.map((p) => (
                <Picker.Item
                  key={p.id}
                  label={`[PO #${p.po_seq || p.po_number}] ${p.description} (Ord: ${p.quantity})`}
                  value={p.id}
                />
              ))}
            </Picker>
          </View>
        </View>
      ) : null}

      {/* Row 4: Damage section (collapsible) */}
      <Pressable
        style={[s.sectionToggle, hasDamage && s.sectionToggleActive]}
        onPress={() => setShowDamage(!showDamage)}
      >
        <Text style={[s.sectionToggleText, hasDamage && { color: '#b91c1c' }]}>
          {hasDamage ? `${item.damage_qty} damaged` : 'Damage Tracking'}
        </Text>
        <Text style={s.sectionChevron}>{showDamage ? '▲' : '▼'}</Text>
      </Pressable>

      {showDamage ? (
        <View style={s.damageContent}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Damaged Qty</Text>
              <TextInput
                style={s.input}
                value={item.damage_qty}
                onChangeText={(v) => onUpdate(index, 'damage_qty', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={s.fieldLabel}>Damage Notes</Text>
              <TextInput
                style={s.input}
                value={item.damage_notes}
                onChangeText={(v) => onUpdate(index, 'damage_notes', v)}
                placeholder="e.g. Scratched, broken"
              />
            </View>
          </View>
        </View>
      ) : null}

      {/* Row 5: Flag Issue toggle */}
      <View style={[s.issueSection, item.issue_type ? s.issueSectionActive : null]}>
        <Pressable
          style={s.issueToggle}
          onPress={() => onUpdate(index, 'issue_type', item.issue_type ? null : 'WRONG_ITEM')}
        >
          <View style={[s.checkbox, item.issue_type ? s.checkboxActive : null]} />
          <Text style={[s.issueToggleText, item.issue_type ? s.issueToggleTextActive : null]}>
            Flag Issue
          </Text>
        </Pressable>

        {item.issue_type ? (
          <>
            {/* Issue type picker */}
            <View style={[s.fieldRow, { marginTop: 8 }]}>
              <Text style={s.fieldLabel}>Issue Type</Text>
              <View style={[s.pickerShell, { borderColor: '#ef4444' }]}>
                <Picker
                  selectedValue={item.issue_type}
                  onValueChange={(v) => onUpdate(index, 'issue_type', v)}
                  style={PICKER_STYLE}
                  itemStyle={PICKER_ITEM_STYLE}
                >
                  {ISSUE_TYPE_OPTIONS.map((opt) => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Issue notes */}
            <View style={{ marginTop: 8 }}>
              <Text style={s.fieldLabel}>Notes</Text>
              <TextInput
                style={[s.input, { minHeight: 60, textAlignVertical: 'top' }]}
                value={item.issue_notes || ''}
                onChangeText={(v) => onUpdate(index, 'issue_notes', v)}
                placeholder="Describe the issue..."
                multiline
              />
            </View>

            {/* PM request info banner */}
            <View style={s.infoBanner}>
              <Text style={s.infoBannerText}>
                This will create a request for the PM to review and follow up with the vendor.
              </Text>
              {linkedPoItem ? (
                <Text style={s.infoBannerLink}>
                  Linked to PO #{linkedPoItem.po_seq || linkedPoItem.po_number} — {linkedPoItem.description}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  fieldRow: {
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  pickerShell: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  removeBtn: {
    marginLeft: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  removeBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 16,
  },
  /* Collapsible section toggle */
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  sectionToggleActive: {
    backgroundColor: '#fef2f2',
  },
  sectionToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  sectionChevron: {
    fontSize: 11,
    color: '#94a3b8',
  },
  damageContent: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  /* Issue section */
  issueSection: {
    marginTop: 10,
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 10,
  },
  issueSectionActive: {
    backgroundColor: '#fee2e2',
  },
  issueToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  checkboxActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  issueToggleText: {
    fontWeight: '600',
    color: '#334155',
    fontSize: 14,
  },
  issueToggleTextActive: {
    color: '#991b1b',
  },
  infoBanner: {
    marginTop: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 10,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 17,
  },
  infoBannerLink: {
    fontSize: 11,
    color: '#991b1b',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
