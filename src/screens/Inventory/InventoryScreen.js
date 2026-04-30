<<<<<<< HEAD
=======
import { useState } from 'react';
>>>>>>> main
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
<<<<<<< HEAD

const LOCATIONS = ['warehouse', 'yard', 'jobsite', 'transit'];
=======
>>>>>>> main

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
<<<<<<< HEAD
  } = useInventory();
=======
    searchQuery,
    setSearchQuery,
    filterLocation,
    setFilterLocation,
    locationOptions,
  } = useInventory();

  const [showAddStock, setShowAddStock] = useState(false);
>>>>>>> main

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Inventory</Text>

        {needsProject ? <EmptyState title="Pick a job" /> : null}

        {error ? <Text style={styles.msg}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {canAdd && !needsProject ? (
<<<<<<< HEAD
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
=======
          <View style={{ marginBottom: 16 }}>
            <Pressable 
              onPress={() => setShowAddStock(!showAddStock)}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#eff6ff', 
                borderRadius: 12, 
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: '#bfdbfe',
                marginBottom: showAddStock ? 16 : 0
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#2563eb' }}>
                {showAddStock ? '✕ Close Add Stock' : '＋ Add Stock Line'}
              </Text>
            </Pressable>

            {showAddStock && (
              <View style={{ marginTop: 12, paddingHorizontal: 4 }}>
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
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 12 }}>
                  {locationOptions.map((loc) => (
                    <Pressable
                      key={loc}
                      onPress={() => setLocation(loc)}
                      style={[
                        styles.qtyBtn,
                        { backgroundColor: '#ffffff', width: '48%', alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
                        location === loc && { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
                      ]}
                    >
                      <Text style={[{ fontSize: 14, color: '#334155', fontWeight: '500' }, location === loc && { color: '#ffffff', fontWeight: '600' }]}>{loc}</Text>
                    </Pressable>
                  ))}
                </View>
                {saveError ? <Text style={styles.msg}>{saveError}</Text> : null}
                <Pressable style={styles.submit} onPress={() => {
                  addItem();
                  setShowAddStock(false);
                }}>
                  <Text style={styles.submitText}>Add to inventory</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}

        {!needsProject && !loading ? (
          <View style={{ marginTop: 24, marginBottom: 16, padding: 16, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Text style={[styles.formTitle, { marginTop: 0, marginBottom: 12 }]}>Search & Filter</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#ffffff', marginBottom: 12 }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search items by name..."
            />
            <Text style={[styles.label, { marginTop: 0, marginBottom: 6 }]}>Filter by Location</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
              <Pressable
                onPress={() => setFilterLocation('')}
                style={[
                  styles.qtyBtn,
                  { backgroundColor: '#ffffff', width: '48%', alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
                  filterLocation === '' && { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
                ]}
              >
                <Text style={[{ fontSize: 14, color: '#334155', fontWeight: '500' }, filterLocation === '' && { color: '#ffffff', fontWeight: '600' }]}>All</Text>
              </Pressable>
              {locationOptions.map((loc) => (
                <Pressable
                  key={loc}
                  onPress={() => setFilterLocation(loc)}
                  style={[
                    styles.qtyBtn,
                    { backgroundColor: '#ffffff', width: '48%', alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
                    filterLocation === loc && { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
                  ]}
                >
                  <Text style={[{ fontSize: 14, color: '#334155', fontWeight: '500' }, filterLocation === loc && { color: '#ffffff', fontWeight: '600' }]}>{loc}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {!needsProject && !loading && items.length === 0 ? (
          <EmptyState title="No inventory items match" />
        ) : null}

        {items.map((item) => {
          const getLocationColors = (loc) => {
            const palettes = [
              { bg: '#eff6ff', text: '#1d4ed8', border: '#3b82f6' }, // Blue
              { bg: '#f0fdf4', text: '#15803d', border: '#22c55e' }, // Green
              { bg: '#fdf2f8', text: '#be185d', border: '#ec4899' }, // Pink
              { bg: '#faf5ff', text: '#6b21a8', border: '#a855f7' }, // Purple
              { bg: '#fff7ed', text: '#c2410c', border: '#f97316' }, // Orange
              { bg: '#f0fdfa', text: '#0f766e', border: '#14b8a6' }, // Teal
            ];
            const idx = locationOptions.indexOf(loc);
            if (idx >= 0) return palettes[idx % palettes.length];
            return { bg: '#f1f5f9', text: '#475569', border: '#94a3b8' };
          };
          const colors = getLocationColors(item.location);
>>>>>>> main

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
