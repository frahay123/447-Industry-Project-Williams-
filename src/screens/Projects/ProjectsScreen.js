import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ProjectsScreen.styles';
import { useProjects } from './ProjectsScreen.logic';

const STATUS_COLORS = {
  active: { bg: '#dcfce7', text: '#16a34a', border: '#22c55e' },
  completed: { bg: '#dbeafe', text: '#2563eb', border: '#3b82f6' },
  on_hold: { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
};

export default function ProjectsScreen() {
  const { projects } = useProjects();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Projects</Text>
        <Text style={styles.subtitle}>
          Manage job sites and track material flow
        </Text>

        {projects.map((project) => {
          const colors = STATUS_COLORS[project.status] || STATUS_COLORS.active;

          return (
            <View
              key={project.id}
              style={[styles.card, { borderLeftColor: colors.border }]}
            >
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.jobNumber}>{project.jobNumber}</Text>
              <Text style={styles.location}>{project.location}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {project.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
