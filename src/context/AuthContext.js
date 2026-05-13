import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROLE_IDS, getRoleById, ROLES_REVISION } from '../constants/roles';
import { apiFetch } from '../api/client';
import { registerForPushNotificationsAsync, uploadPushToken } from '../notifications';

const STORAGE_SESSION = 'mec2_auth_session_v2';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_SESSION);
        const sess = raw ? JSON.parse(raw) : null;
        if (!cancelled) {
          const validSess = sess?.token ? sess : null;
          setSession(validSess);
          // Re-upload push token on app start in case it changed or wasn't sent yet.
          if (validSess) {
            registerForPushNotificationsAsync()
              .then((pushToken) => uploadPushToken(pushToken, validSess))
              .catch(() => {});
          }
        }
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistSession = useCallback(async (next) => {
    setSession(next);
    if (next?.token) {
      await AsyncStorage.setItem(STORAGE_SESSION, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(STORAGE_SESSION);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email: String(email).trim(), password: String(password) },
      }, null);
      const sess = {
        token: data.token,
        displayName: data.displayName,
        roleId: data.roleId,
        foremanType: data.foremanType || null,
        userId: data.userId,
      };
      await persistSession(sess);
      // Register push token after successful login (iOS only, non-blocking).
      registerForPushNotificationsAsync()
        .then((pushToken) => uploadPushToken(pushToken, sess))
        .catch(() => {});
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'Login failed.' };
    }
  }, [persistSession]);

  const logout = useCallback(async () => {
    await persistSession(null);
  }, [persistSession]);

  const currentRole = useMemo(() => {
    if (!session?.roleId) return null;
    return getRoleById(session.roleId);
  }, [session?.roleId, ROLES_REVISION]);

  const canManageUsers = session?.roleId === ROLE_IDS.ADMINISTRATOR;

  const apiSession = useMemo(
    () => (session?.token ? { ...session, canManageUsers } : null),
    [session, canManageUsers],
  );

  const value = useMemo(
    () => ({
      ready,
      session,
      apiSession,
      currentRole,
      canManageUsers,
      login,
      logout,
    }),
    [ready, session, apiSession, currentRole, canManageUsers, login, logout, ROLES_REVISION],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
