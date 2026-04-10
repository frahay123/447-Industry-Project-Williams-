import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './AdminScreen.styles';
import { useAdminScreen } from './AdminScreen.logic';
import { getRoleById } from '../../constants/roles';
import { EmptyState } from '../../components/EmptyState';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

export default function AdminScreen() {
  const {
    canManageUsers,
    users,
    logout,
    assignableRoles,
    username,
    setUsername,
    password,
    setPassword,
    roleId,
    setRoleId,
    feedback,
    onAddUser,
    confirmRemoveUser,
  } = useAdminScreen();

  if (!canManageUsers) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['bottom', 'left', 'right']}
      >
        <View style={[styles.content, { flex: 1 }]}>
          <Text style={styles.title}>Users</Text>
          <EmptyState title="Restricted" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Users</Text>
          <Pressable onPress={logout} hitSlop={10} accessibilityRole="button">
            <Text style={styles.logoutLink}>Log out</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Accounts</Text>
        {users.map((u) => (
          <View key={u.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardTextCol}>
                <Text style={styles.rowUser}>{u.username}</Text>
                <Text style={styles.rowRole}>
                  {getRoleById(u.roleId)?.label ?? u.roleId}
                </Text>
              </View>
              <Pressable
                style={styles.removeBtn}
                onPress={() => confirmRemoveUser(u)}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Text style={styles.sectionLabel}>New user</Text>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Text style={styles.label}>Role</Text>
        <View style={styles.roleRow}>
          {assignableRoles.map((r) => {
            const on = roleId === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => setRoleId(r.id)}
                style={[styles.roleChip, on && styles.roleChipOn]}
              >
                <Text
                  style={[styles.roleChipText, on && styles.roleChipTextOn]}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.addButton} onPress={onAddUser}>
          <Text style={styles.addButtonText}>Create user</Text>
        </Pressable>

        {feedback.text ? (
          <Text
            style={[
              styles.message,
              feedback.type === 'ok' ? styles.messageOk : styles.messageErr,
            ]}
          >
            {feedback.text}
          </Text>
        ) : null}
      </KeyboardSafeScroll>
    </SafeAreaView>
  );
}
