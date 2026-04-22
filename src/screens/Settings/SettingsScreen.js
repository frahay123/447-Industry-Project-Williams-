import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './SettingsScreen.styles';
import { useSettings } from './SettingsScreen.logic';
import { EmptyState } from '../../components/EmptyState';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

export default function SettingsScreen() {
  const {
    isAdmin,
    loading,
    error,
    saveError,
    saveSuccess,
    warehouse1Name,
    setWarehouse1Name,
    warehouse2Name,
    setWarehouse2Name,
    saveSettings,
  } = useSettings();

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState title="Not authorized" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin Settings</Text>

        {error ? <Text style={styles.msg}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        <Text style={styles.formTitle}>Warehouse Configuration</Text>
        
        <Text style={styles.label}>Warehouse 1 Name</Text>
        <TextInput
          style={styles.input}
          value={warehouse1Name}
          onChangeText={setWarehouse1Name}
          placeholder="e.g. Main Warehouse"
        />

        <Text style={styles.label}>Warehouse 2 Name</Text>
        <TextInput
          style={styles.input}
          value={warehouse2Name}
          onChangeText={setWarehouse2Name}
          placeholder="e.g. Overflow Warehouse"
        />

        {saveError ? <Text style={styles.msg}>{saveError}</Text> : null}
        {saveSuccess ? <Text style={styles.successMsg}>{saveSuccess}</Text> : null}

        <Pressable style={styles.submit} onPress={saveSettings}>
          <Text style={styles.submitText}>Save Settings</Text>
        </Pressable>
      </KeyboardSafeScroll>
    </SafeAreaView>
  );
}
