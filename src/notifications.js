/**
 * Push notification helpers — iOS only (APNs via Expo).
 *
 * Call registerForPushNotificationsAsync() once after login and POST the
 * returned Expo push token to /api/users/push-token so the server can send
 * targeted notifications.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiFetch } from './api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission and return the Expo push token string, or null if:
 *  - not running on a physical iOS device
 *  - permission denied
 *  - any error occurs
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS !== 'ios') return null;
  if (!Device.isDevice) {
    console.log('[push] Skipping push registration — not a physical device.');
    return null;
  }
  // Expo Go cannot issue push tokens without an EAS projectId. Skip silently
  // so the error doesn't surface; use a development build for real pushes.
  if (Constants.appOwnership === 'expo') {
    console.log('[push] Skipping push registration — Expo Go does not support push tokens. Use a development build.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[push] Push notification permission not granted.');
    return null;
  }

  try {
    // projectId is required by Expo SDK 49+ when no EAS project is configured.
    // Read it from the EAS extra field; if absent (Expo Go / bare workflow)
    // omit the option so the SDK falls back to manifest-derived values.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? undefined;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : {},
    );
    return tokenData.data ?? null;
  } catch (e) {
    console.error('[push] getExpoPushTokenAsync failed:', e);
    return null;
  }
}

/**
 * Register device push token with the backend. Safe to call on every login.
 * @param {string} token - Expo push token string
 * @param {{ token: string } | null} apiSession - current auth session
 */
export async function uploadPushToken(token, apiSession) {
  if (!token || !apiSession) return;
  try {
    await apiFetch('/api/users/push-token', {
      method: 'POST',
      body: { token },
    }, apiSession);
    console.log('[push] Token registered:', token.slice(0, 30), '…');
  } catch (e) {
    console.warn('[push] Could not register push token:', e.message);
  }
}
