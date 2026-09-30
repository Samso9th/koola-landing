interface Env {
  API_ORIGIN?: string;
  ASSETS?: { fetch(request: Request): Promise<Response> };
}

const MAX_BYTES = 4096;
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Strict-Transport-Security': 'max-age=31536000',
};
function json(status: number, body: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
}
function error(status: number, code: string, extra: Record<string, string> = {}) {
  return json(status, { ok: false, error: code }, extra);
}
class InputError extends Error {
  status: number; code: string;
  constructor(status: number, code: string) { super(code); this.status=status; this.code=code; }
}
async function readBody(request: Request): Promise<unknown> {
  const length = request.headers.get('Content-Length');
  if (length && /^\d+$/.test(length) && Number(length) > MAX_BYTES) {
    throw new InputError(413, 'payload_too_large');
  }
  if (!request.body) throw new InputError(400, 'invalid_json');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new InputError(413, 'payload_too_large');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)); }
  catch { throw new InputError(400, 'invalid_json'); }
}
function validate(input: unknown) {
  const invalid = () => { throw new InputError(400, 'invalid_lead'); };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return invalid();
  const value = input as Record<string, unknown>;
  const keys = ['name', 'email', 'phone', 'city', 'role', 'consent', 'website'];
  if (Object.keys(value).some(key => !keys.includes(key))) return invalid();
  for (const key of ['name', 'email', 'phone', 'city', 'role', 'website']) {
    if (typeof value[key] !== 'string') return invalid();
  }
  const raw = value as Record<string, string>;
  if (raw.name.length > 120 || /[\p{Cc}\p{Cf}]/u.test(raw.name)) return invalid();
  const name = raw.name.trim().normalize('NFC').replace(/\s+/gu, ' ');
  // Supports personal and business names in all scripts, including one-word names.
  if (name.length < 2 || !/\p{L}/u.test(name) || /[<>]/u.test(name)) return invalid();
  if (raw.email.length > 254) return invalid();
  const email = raw.email.trim().toLowerCase();
  const [local] = email.split('@');
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)
      || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')
      || email.split('@')[1].split('.').some(label => label.length > 63)) return invalid();
  if (raw.phone.length > 32 || !/^\+?[0-9 ()-]+$/.test(raw.phone.trim())) return invalid();
  let phone = raw.phone.trim().replace(/[ ()-]/g, '');
  if (/^0[789]\d{9}$/.test(phone)) phone = '+234' + phone.slice(1);
  else if (/^234[789]\d{9}$/.test(phone)) phone = '+' + phone;
  if (!/^\+234[789]\d{9}$/.test(phone)) return invalid();
  if (!['Kano', 'Katsina'].includes(raw.city)
      || !['customer', 'vendor', 'rider', 'affiliate'].includes(raw.role)
      || value.consent !== true || raw.website !== '') return invalid();
  return { name, email, phone, city: raw.city, role: raw.role };
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS ? env.ASSETS.fetch(request) : error(503, 'assets_unavailable');
    }
    if (url.pathname !== '/api/leads' && url.pathname !== '/api/health') return error(404, 'not_found');
    const method = url.pathname === '/api/health' ? 'GET' : 'POST';
    // OPTIONS receives no CORS grant; this is a same-origin API.
    if (request.method !== method) return error(405, 'method_not_allowed', { Allow: method });
    if (url.pathname === '/api/leads') {
      const origin = request.headers.get('Origin');
      if ((origin !== null && origin !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
        return error(403, 'origin_not_allowed');
      }
      if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        return error(415, 'unsupported_media_type');
      }
      if (request.headers.has('Content-Encoding') && request.headers.get('Content-Encoding') !== 'identity') {
        return error(415, 'unsupported_content_encoding');
      }
    }
    const origin = env.API_ORIGIN;
    if (!origin || !/^https:\/\/[^/]+$/.test(origin)) return error(503, 'service_unavailable');
    try {
      if (url.pathname === '/api/health') {
        const response = await fetch(`${origin}/health/ready`, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
        return response.ok ? json(200, { ok: true }) : error(503, 'service_unavailable');
      }
      const lead = validate(await readBody(request));
      const response = await fetch(`${origin}/api/v1/leads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ ...lead, consent: true }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: { code?: string } } | null;
      if (response.ok && result?.ok === true) return json(200, { ok: true });
      if (response.status === 429) return error(429, 'rate_limited', { 'Retry-After': response.headers.get('Retry-After') || '60' });
      if (response.status === 400) return error(400, 'invalid_lead');
      return error(503, 'service_unavailable');
    } catch (cause) {
      if (cause instanceof InputError) return error(cause.status, cause.code);
      return error(503, 'service_unavailable');
    }
  },
};
