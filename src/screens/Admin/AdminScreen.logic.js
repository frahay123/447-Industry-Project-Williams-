import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ASSIGNABLE_ROLES, ROLE_IDS, FOREMAN_TYPES } from '../../constants/roles';
import { apiFetch } from '../../api/client';

export function useAdminScreen() {
  const { canManageUsers, apiSession, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(ROLE_IDS.WAREHOUSE_STAFF);
  const [foremanType, setForemanType] = useState(FOREMAN_TYPES[0].id);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [editingUserId, setEditingUserId] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const isForeman = roleId === ROLE_IDS.FOREMAN;

  const loadUsers = useCallback(async () => {
    if (!canManageUsers || !apiSession) return;
    try {
      const rows = await apiFetch('/api/auth/users', {}, apiSession);
      setUsers(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setFeedback({ type: 'err', text: e.message ?? 'Could not load users.' });
    }
  }, [canManageUsers, apiSession]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const onAddUser = useCallback(async () => {
    setFeedback({ type: '', text: '' });
    try {
      await apiFetch('/api/auth/users', {
        method: 'POST',
        body: {
          email,
          displayName,
          password,
          roleId,
          foremanType: isForeman ? foremanType : undefined,
        },
      }, apiSession);
      setEmail('');
      setDisplayName('');
      setPassword('');
      await loadUsers();
      Alert.alert('Saved', 'Sign out to sign in as the new user?', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Sign out', style: 'default', onPress: () => logout() },
      ]);
    } catch (e) {
      setFeedback({ type: 'err', text: e.message ?? 'Could not create user.' });
    }
  }, [email, displayName, password, roleId, foremanType, isForeman, apiSession, loadUsers, logout]);

  const confirmRemoveUser = useCallback(
    (u) => {
      Alert.alert(
        'Remove account',
        `Remove "${u.display_name}" (${u.email})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              setFeedback({ type: '', text: '' });
              try {
                await apiFetch(`/api/auth/users/${u.id}`, { method: 'DELETE' }, apiSession);
                setFeedback({ type: 'ok', text: 'Removed.' });
                await loadUsers();
              } catch (e) {
                setFeedback({ type: 'err', text: e.message ?? 'Could not remove user.' });
              }
            },
          },
        ],
      );
    },
    [apiSession, loadUsers],
  );

  const beginEditUser = useCallback((u) => {
    setFeedback({ type: '', text: '' });
    setEditingUserId(u.id);
    setEditEmail(u.email);
    setEditDisplayName(u.display_name);
    setEditPassword('');
  }, []);

  const cancelEditUser = useCallback(() => {
    setEditingUserId(null);
    setEditEmail('');
    setEditDisplayName('');
    setEditPassword('');
  }, []);

  const saveEditUser = useCallback(async () => {
    if (!editingUserId) return;
    setFeedback({ type: '', text: '' });
    try {
      await apiFetch(`/api/auth/users/${editingUserId}`, {
        method: 'PATCH',
        body: {
          email: editEmail,
          displayName: editDisplayName,
          password: editPassword || undefined,
        },
      }, apiSession);
      setFeedback({ type: 'ok', text: 'User updated.' });
      cancelEditUser();
      await loadUsers();
    } catch (e) {
      setFeedback({ type: 'err', text: e.message ?? 'Could not update user.' });
    }
  }, [editingUserId, editEmail, editDisplayName, editPassword, apiSession, cancelEditUser, loadUsers]);

  return {
    canManageUsers,
    users,
    logout,
    assignableRoles: ASSIGNABLE_ROLES,
    email,
    setEmail,
    displayName,
    setDisplayName,
    password,
    setPassword,
    roleId,
    setRoleId,
    isForeman,
    foremanType,
    setForemanType,
    foremanTypes: FOREMAN_TYPES,
    feedback,
    onAddUser,
    confirmRemoveUser,
    editingUserId,
    editEmail,
    setEditEmail,
    editDisplayName,
    setEditDisplayName,
    editPassword,
    setEditPassword,
    beginEditUser,
    cancelEditUser,
    saveEditUser,
  };
}
