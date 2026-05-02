import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ProjectsScreen.styles';
import { useProjects } from './ProjectsScreen.logic';
import { EmptyState } from '../../components/EmptyState';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

export default function ProjectsScreen() {
  const {
    projects,
    selectedProjectId,
    loading,
    error,
    canAdd,
    name,
    setName,
    jobNumber,
    setJobNumber,
    location,
    setLocation,
    saveError,
    createProject,
    selectAsCurrent,
    canRemove,
    confirmRemoveProject,
    reload,
  } = useProjects();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Projects</Text>

        {error ? (
          <Text style={styles.msg}>{error}</Text>
        ) : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {canAdd ? (
          <>
            <Text style={styles.formTitle}>New project</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. HVAC Building A"
            />
            <Text style={styles.label}>Job number (optional)</Text>
            <TextInput
              style={styles.input}
              value={jobNumber}
              onChangeText={setJobNumber}
              autoCapitalize="characters"
            />
<<<<<<< HEAD
            <Text style={styles.label}>Location (optional)</Text>
=======
            <Text style={styles.label}>Location</Text>
>>>>>>> main
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
            />
            {saveError ? <Text style={styles.msg}>{saveError}</Text> : null}
            <Pressable style={styles.submit} onPress={createProject}>
              <Text style={styles.submitText}>Create project</Text>
            </Pressable>
          </>
        ) : null}

        <Text style={styles.formTitle}>All jobs</Text>
        {!loading && projects.length === 0 ? (
          <EmptyState title="No projects" />
        ) : null}

        {projects.map((p) => {
          const current = p.id === selectedProjectId;
          return (
            <View key={p.id} style={styles.card}>
              <Text style={styles.projectName}>{p.name}</Text>
              {current ? (
                <View style={styles.currentBadgeWrap}>
                  <Text style={styles.currentBadgeText}>Current job</Text>
                </View>
              ) : null}
              {p.job_number ? (
                <Text style={styles.jobNumber}>{p.job_number}</Text>
              ) : null}
              {p.location ? (
                <Text style={styles.location}>{p.location}</Text>
              ) : null}
              <View style={styles.cardActions}>
                {!current ? (
                  <Pressable
                    style={styles.useJobBtn}
                    onPress={() => selectAsCurrent(p.id)}
                  >
                    <Text style={styles.useJobBtnText}>Use this job</Text>
                  </Pressable>
                ) : null}
                {canRemove ? (
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => confirmRemoveProject(p)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
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
