import { useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { styles } from './DashboardScreen.styles';
import { useDashboard } from './DashboardScreen.logic';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { getTabsForSession } from '../../constants/roles';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

const NO_JOB = '__none__';

/** Bottom-tab screen name for each dashboard stat (must match TabNavigator `name`). */
const STAT_TAB = {
  'Current job': 'Projects',
  'Packing slips': 'Deliveries',
  'Inventory lines': 'Inventory',
  'Pending transfers': 'Transfers',
  'Purchase orders': 'POs',
};

function StatShortcut({ stat, navigation, allowedTabNames }) {
  const tabName = STAT_TAB[stat.label];
  const canNavigate = Boolean(tabName && allowedTabNames.has(tabName));
  const body = (
    <>
      <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </>
  );

  if (!canNavigate) {
    return <View style={styles.statCard}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${tabName}`}
      onPress={() => navigation.navigate(tabName)}
      style={({ pressed }) => [
        styles.statCard,
        styles.statCardPressable,
        pressed && styles.statCardPressed,
      ]}
    >
      {body}
    </Pressable>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { session, canManageUsers } = useAuth();
  const allowedTabNames = useMemo(
    () =>
      new Set(
        getTabsForSession({ ...session, canManageUsers }).filter(Boolean),
      ),
    [session, canManageUsers],
  );

  const { username, roleLabel, stats, apiError, logout, retry } = useDashboard();
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    refreshProjects,
  } = useProject();

  useFocusEffect(
    useCallback(() => {
      refreshProjects();
    }, [refreshProjects]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dashboard</Text>

        <Text style={styles.pickerLabel}>Job</Text>
        <View style={styles.pickerWrap}>
          <Picker
            style={styles.picker}
            itemStyle={styles.pickerItemIOS}
            selectedValue={
              selectedProjectId != null ? String(selectedProjectId) : NO_JOB
            }
            onValueChange={async (value) => {
              if (value === NO_JOB) {
                await setSelectedProjectId(null);
              } else {
                await setSelectedProjectId(parseInt(String(value), 10));
              }
            }}
          >
            <Picker.Item label="Select a job…" value={NO_JOB} />
            {projects.map((p) => (
              <Picker.Item
                key={p.id}
                label={p.name}
                value={String(p.id)}
              />
            ))}
          </Picker>
        </View>
        {projects.length === 0 ? (
          <Text style={styles.pickerHint}>No jobs</Text>
        ) : null}

        {apiError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{apiError}</Text>
            <Pressable onPress={retry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.userCard}>
          <Text style={styles.userMeta}>Signed in as</Text>
          <Text style={styles.userName}>{username}</Text>
          <Text style={styles.roleLine}>{roleLabel}</Text>
          <Pressable onPress={logout} style={styles.logout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        {/* Render stats in rows of 2 */}
        {Array.from({ length: Math.ceil(stats.length / 2) }, (_, rowIdx) => (
          <View key={rowIdx} style={styles.statsRow}>
            {stats.slice(rowIdx * 2, rowIdx * 2 + 2).map((stat) => (
              <StatShortcut
                key={stat.label}
                stat={stat}
                navigation={navigation}
                allowedTabNames={allowedTabNames}
              />
            ))}
          </View>
        ))}

      </KeyboardSafeScroll>
    </SafeAreaView>
  );
}
