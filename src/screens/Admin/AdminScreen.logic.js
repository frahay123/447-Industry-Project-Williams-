import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
<<<<<<< HEAD
import { ASSIGNABLE_ROLES, ROLE_IDS } from '../../constants/roles';

export function useAdminScreen() {
  const { canManageUsers, users, createUser, deleteUser, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(ROLE_IDS.WAREHOUSE_STAFF);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const onAddUser = useCallback(async () => {
    setFeedback({ type: '', text: '' });
    const result = await createUser(username, password, roleId);
=======
import { ASSIGNABLE_ROLES, ROLE_IDS, FOREMAN_TYPES } from '../../constants/roles';

export function useAdminScreen() {
  const {
    canManageUsers,
    users,
    createUser,
    deleteUser,
    updateUserCredentials,
    logout,
  } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(ROLE_IDS.WAREHOUSE_STAFF);
  const [foremanType, setForemanType] = useState(FOREMAN_TYPES[0].id);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const isForeman = roleId === ROLE_IDS.FOREMAN;

  const onAddUser = useCallback(async () => {
    setFeedback({ type: '', text: '' });
    const opts = isForeman ? { foremanType } : {};
    const result = await createUser(username, password, roleId, opts);
>>>>>>> main
    if (result.ok) {
      setUsername('');
      setPassword('');
      Alert.alert('Saved', 'Sign out to sign in as the new user?', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Sign out', style: 'default', onPress: () => logout() },
      ]);
    } else {
      setFeedback({ type: 'err', text: result.error ?? 'Could not create user.' });
    }
<<<<<<< HEAD
  }, [username, password, roleId, createUser, logout]);
=======
  }, [username, password, roleId, foremanType, isForeman, createUser, logout]);
>>>>>>> main

  const confirmRemoveUser = useCallback(
    (u) => {
      Alert.alert(
        'Remove account',
        `Remove "${u.username}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              setFeedback({ type: '', text: '' });
              const r = await deleteUser(u.id);
              if (r.ok) {
                setFeedback({ type: 'ok', text: 'Removed.' });
              } else {
                setFeedback({
                  type: 'err',
                  text: r.error ?? 'Could not remove user.',
                });
              }
            },
          },
        ],
      );
    },
    [deleteUser],
  );

<<<<<<< HEAD
=======
  const beginEditUser = useCallback((u) => {
    setFeedback({ type: '', text: '' });
    setEditingUserId(u.id);
    setEditUsername(u.username);
    setEditPassword('');
  }, []);

  const cancelEditUser = useCallback(() => {
    setEditingUserId(null);
    setEditUsername('');
    setEditPassword('');
  }, []);

  const saveEditUser = useCallback(async () => {
    if (!editingUserId) return;
    setFeedback({ type: '', text: '' });
    const result = await updateUserCredentials(editingUserId, {
      username: editUsername,
      password: editPassword,
    });
    if (result.ok) {
      setFeedback({ type: 'ok', text: 'User updated.' });
      cancelEditUser();
    } else {
      setFeedback({ type: 'err', text: result.error ?? 'Could not update user.' });
    }
  }, [
    editingUserId,
    editUsername,
    editPassword,
    updateUserCredentials,
    cancelEditUser,
  ]);

>>>>>>> main
  return {
    canManageUsers,
    users,
    logout,
    assignableRoles: ASSIGNABLE_ROLES,
    username,
    setUsername,
    password,
    setPassword,
    roleId,
    setRoleId,
<<<<<<< HEAD
    feedback,
    onAddUser,
    confirmRemoveUser,
=======
    isForeman,
    foremanType,
    setForemanType,
    foremanTypes: FOREMAN_TYPES,
    feedback,
    onAddUser,
    confirmRemoveUser,
    editingUserId,
    editUsername,
    setEditUsername,
    editPassword,
    setEditPassword,
    beginEditUser,
    cancelEditUser,
    saveEditUser,
>>>>>>> main
  };
}
