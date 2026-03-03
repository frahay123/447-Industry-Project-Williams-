import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './InventoryScreen.styles';
import { useInventory } from './InventoryScreen.logic';

const LOCATION_COLORS = {
  warehouse: { bg: '#dbeafe', text: '#2563eb', border: '#3b82f6' },
  yard: { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
  jobsite: { bg: '#dcfce7', text: '#16a34a', border: '#22c55e' },
  installed: { bg: '#ede9fe', text: '#7c3aed', border: '#8b5cf6' },
  in_transit: { bg: '#fee2e2', text: '#dc2626', border: '#ef4444' },
};

export default function InventoryScreen() {
  const { items } = useInventory();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>
          Track material locations and quantities
        </Text>

        {items.map((item) => {
          const colors = LOCATION_COLORS[item.location] || LOCATION_COLORS.warehouse;

          return (
            <View
              key={item.id}
              style={[styles.card, { borderLeftColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemProject}>{item.project}</Text>
                <View style={[styles.locationBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.locationText, { color: colors.text }]}>
                    {item.location.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.quantity}>{item.quantity}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
