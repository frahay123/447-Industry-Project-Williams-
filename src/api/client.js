import { getApiBaseUrl } from '../config/api';

const DEFAULT_TIMEOUT_MS = 25_000;

/**
 * @param {string} path
 * @param {{ method?: string, body?: object|FormData, headers?: object, timeoutMs?: number }} options
 * @param {{ token?: string } | null} session
 */
export async function apiFetch(path, options = {}, session) {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const headers = {
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(options.headers || {}),
  };

  let body = options.body;
  if (body != null && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }
  if (body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: body ?? undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = e?.name === 'AbortError' || controller.signal.aborted;
    const hintLocal =
      base.includes('127.0.0.1') || base.includes('localhost')
        ? ' On a physical phone, set expo.extra.apiUrl in app.json to your EC2 URL (prefer http://IP with no port — nginx on port 80) and rebuild (or use EXPO_PUBLIC_API_URL).'
        : '';
    const hintTimeout = aborted
      ? ` No response within ${timeoutMs / 1000}s. Use http://YOUR_IP (port 80) not :3000 if your network blocks high ports. On the server run terraform/scripts/enable-nginx-api-proxy.sh (sudo). Also confirm EC2 is running, SG allows 80/3000, IP matches terraform output, and pm2 is up.`
      : '';
    throw new Error(
      `${aborted ? 'Request timed out' : e?.message || 'Network request failed'} (${url}).${hintLocal}${hintTimeout}`,
    );
  } finally {
    clearTimeout(tid);
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    let msg = data?.error || data?.message;
    if (!msg && typeof data?.raw === 'string' && data.raw.trim()) {
      msg = data.raw.replace(/\s+/g, ' ').trim().slice(0, 160);
    }
    if (!msg) {
      msg =
        (res.statusText && String(res.statusText).trim()) ||
        (res.status ? `HTTP ${res.status}` : '') ||
        'Request failed';
    }
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
