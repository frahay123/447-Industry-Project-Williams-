import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './RequestsScreen.styles';

export default function RequestsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Requests</Text>
        <Text style={styles.subtitle}>Material request management</Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}></Text>
          <Text style={styles.placeholderText}>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
