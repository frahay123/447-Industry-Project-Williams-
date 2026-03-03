import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './DashboardScreen.styles';
import { useDashboard } from './DashboardScreen.logic';

export default function DashboardScreen() {
  const { stats, recentActivity } = useDashboard();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>
          Overview of your projects and materials
        </Text>

        <View style={styles.statsRow}>
          {stats.slice(0, 2).map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statsRow}>
          {stats.slice(2, 4).map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.map((item) => (
          <View key={item.id} style={styles.activityItem}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
