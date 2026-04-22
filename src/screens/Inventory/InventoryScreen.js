import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './InventoryScreen.styles';
import { useInventory } from './InventoryScreen.logic';
import { EmptyState } from '../../components/EmptyState';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

const LOCATIONS = ['warehouse', 'yard', 'jobsite', 'transit'];

export default function InventoryScreen() {
  const {
    items,
    loading,
    error,
    canAdd,
    canAdjustQty,
    needsProject,
    description,
    setDescription,
    quantity,
    setQuantity,
    location,
    setLocation,
    saveError,
    addItem,
    changeQty,
    reload,
  } = useInventory();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Inventory</Text>

        {needsProject ? <EmptyState title="Pick a job" /> : null}

        {error ? <Text style={styles.msg}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {canAdd && !needsProject ? (
          <>
            <Text style={styles.formTitle}>Add stock line</Text>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Material description"
            />
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Location</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LOCATIONS.map((loc) => (
                <Pressable
                  key={loc}
                  onPress={() => setLocation(loc)}
                  style={[
                    styles.qtyBtn,
                    location === loc && { backgroundColor: '#bfdbfe' },
                  ]}
                >
                  <Text style={styles.qtyBtnText}>{loc}</Text>
                </Pressable>
              ))}
            </View>
            {saveError ? <Text style={styles.msg}>{saveError}</Text> : null}
            <Pressable style={styles.submit} onPress={addItem}>
              <Text style={styles.submitText}>Add to inventory</Text>
            </Pressable>
          </>
        ) : null}

        {!needsProject && !loading && items.length === 0 ? (
          <EmptyState title="No inventory" />
        ) : null}

        {items.map((item) => {
          const colors =
            {
              warehouse: { bg: '#dbeafe', text: '#2563eb', border: '#3b82f6' },
              yard: { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
              jobsite: { bg: '#dcfce7', text: '#16a34a', border: '#22c55e' },
              transit: { bg: '#fee2e2', text: '#dc2626', border: '#ef4444' },
            }[item.location] || {
              bg: '#f1f5f9',
              text: '#475569',
              border: '#94a3b8',
            };

          return (
            <View
              key={item.id}
              style={[styles.card, { borderLeftColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemProject}>
                  {item.project_name || 'No project'}
                </Text>
                <View style={[styles.locationBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.locationText, { color: colors.text }]}>
                    {item.location}
                  </Text>
                </View>
                {canAdjustQty ? (
                  <View style={styles.qtyRow}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => changeQty(item.id, -1)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => changeQty(item.id, 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
              {!canAdjustQty ? (
                <Text style={styles.quantity}>{item.quantity}</Text>
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
