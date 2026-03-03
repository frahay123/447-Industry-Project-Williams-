import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './DeliveriesScreen.styles';
import { useDeliveries } from './DeliveriesScreen.logic';

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', text: '#d97706' },
  in_transit: { bg: '#dbeafe', text: '#2563eb' },
  received: { bg: '#dcfce7', text: '#16a34a' },
  inspected: { bg: '#ede9fe', text: '#7c3aed' },
  stored: { bg: '#f1f5f9', text: '#475569' },
};

export default function DeliveriesScreen() {
  const { deliveries } = useDeliveries();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Deliveries</Text>
        <Text style={styles.subtitle}>
          Track material deliveries and shipments
        </Text>

        {deliveries.map((delivery) => {
          const colors = STATUS_COLORS[delivery.status] || STATUS_COLORS.pending;

          return (
            <View key={delivery.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deliveryNumber}>
                    #{delivery.number}
                  </Text>
                  <Text style={styles.carrier}>
                    {delivery.carrier} · {delivery.items} items
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.statusText, { color: colors.text }]}>
                    {delivery.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.project}>{delivery.project}</Text>
                <Text style={styles.date}>{delivery.date}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
