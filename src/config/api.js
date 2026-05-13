import Constants from 'expo-constants';

/**
 * Set your API URL:
 * - app.json → expo.extra.apiUrl, or
 * - EXPO_PUBLIC_API_URL (e.g. http://YOUR_EC2_IP:3000)
 * Android emulator: http://10.0.2.2:3000
 */
export function getApiBaseUrl() {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl;
  if (fromExtra && String(fromExtra).trim()) {
    return String(fromExtra).replace(/\/$/, '');
  }
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return String(process.env.EXPO_PUBLIC_API_URL).replace(/\/$/, '');
  }
  return 'http://127.0.0.1:3000';
}
