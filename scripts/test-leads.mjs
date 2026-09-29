#!/usr/bin/env node
// Run against a separately started LOCAL Wrangler preview and isolated D1 state.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const base = new URL(process.env.LEADS_TEST_URL || 'http://localhost:8787');
assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Tests require a local preview');
const state = process.env.LEADS_TEST_STATE || '.wrangler/leads-test';
const email = `worker-test-${randomUUID()}@example.com`;
const lead = { name: 'Amina Musa', email, phone: '0803 123 4567', city: 'Kano', role: 'customer', consent: true, website: '' };
function sql(command) {
  const output = execFileSync('npx', ['--no-install', 'wrangler', 'd1', 'execute', 'LEADS_DB',
    '--local', '--persist-to', state, '--command', command, '--json'], { cwd, encoding: 'utf8' });
  const result = JSON.parse(output);
  assert(result.every(item => item.success), 'D1 command failed');
  return result.flatMap(item => item.results || []);
}
async function call(body = lead, options = {}) {
  const response = await fetch(new URL(options.path || '/api/leads', base), {
    method: options.method || 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base.origin, ...options.headers },
    ...(options.method === 'GET' || options.method === 'OPTIONS' ? {} : {
      body: options.raw ?? JSON.stringify(body), ...(options.raw instanceof ReadableStream ? { duplex: 'half' } : {}),
    }),
  });
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert(response.headers.get('content-security-policy'));
  const data = await response.json();
  assert.equal(response.status, options.status ?? 200, JSON.stringify(data));
  if (response.ok) assert.deepEqual(data, { ok: true });
  else { assert.equal(data.ok, false); assert.equal(typeof data.error, 'string'); }
  return response;
}

// This suite intentionally resets quotas and temporarily renames a table. Use only
// the dedicated local state directory documented in docs/leads-worker.md.
assert.equal((await fetch(new URL('/api/health', base))).status, 200, 'Start preview and apply migrations first');
sql('DELETE FROM lead_rate_limits');
try {
  await call(null, { method: 'GET', path: '/api/health' });
  await call(lead, { headers: { Origin: 'https://attacker.example' }, status: 403 });
  await call(lead, { headers: { Origin: 'null' }, status: 403 });
  await call(lead, { headers: { 'Sec-Fetch-Site': 'cross-site' }, status: 403 });
  await call(lead, { headers: { 'Content-Type': 'text/plain' }, status: 415 });
  await call(null, { method: 'OPTIONS', status: 405 });
  await call(null, { method: 'GET', status: 405 });
  await call(null, { method: 'GET', path: '/api/unknown', status: 404 });
  for (const patch of [
    { name: '' }, { name: 'a'.repeat(121) }, { name: '12345' }, { name: 'A\nB' },
    { email: 'a@b' }, { email: 'a..b@example.com' }, { email: 'a'.repeat(65) + '@example.com' },
    { phone: '+15551234567' }, { phone: '0803123' }, { city: 'Abuja' },
    { role: 'admin' }, { consent: false }, { consent: 'true' }, { website: 'https://bot.example' },
    { website: undefined }, { unexpected: true },
  ]) await call({ ...lead, ...patch }, { status: 400 });
  await call([], { status: 400 });
  await call(null, { raw: '{', status: 400 });
  await call(null, { raw: ' '.repeat(4097), status: 413 });
  // No Content-Length: exercise the actual streaming byte cap, including UTF-8.
  await call(null, { raw: new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode(' '.repeat(2000)));
    controller.enqueue(new TextEncoder().encode('é'.repeat(1100)));
    controller.close();
  } }), status: 413 });
  assert.equal(sql(`SELECT count(*) AS n FROM leads WHERE email = '${email}'`)[0].n, 0);
  sql('DELETE FROM lead_rate_limits');
  await call(lead);
  await call({ ...lead, email: email.toUpperCase(), name: 'Changed Name', phone: '+2349012345678' });
  const rows = sql(`SELECT name, email, phone, city, role, consent FROM leads WHERE email = '${email}'`);
  assert.deepEqual(rows, [{ name: lead.name, email, phone: '+2348031234567', city: 'Kano', role: 'customer', consent: 1 }]);
  for (const role of ['vendor', 'rider', 'affiliate']) await call({ ...lead, role, phone: '2348031234567' });
  await call({ ...lead, city: 'Katsina', phone: '+2348031234567' });
  assert.equal(sql(`SELECT count(*) AS n FROM leads WHERE email = '${email}'`)[0].n, 5);
  // Force a real storage failure: a dummy {ok:true} implementation must fail.
  sql('ALTER TABLE leads RENAME TO leads_test_unavailable');
  try {
    await call(lead, { status: 503 });
    await call(null, { method: 'GET', path: '/api/health', status: 503 });
  } finally { sql('ALTER TABLE leads_test_unavailable RENAME TO leads'); }
  sql('DELETE FROM lead_rate_limits');
  // Concurrent requests prove the quota cannot be bypassed by racing updates.
  const responses = await Promise.all(Array.from({ length: 35 }, () => fetch(new URL('/api/leads', base), {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base.origin }, body: JSON.stringify(lead),
  })));
  assert.equal(responses.filter(r => r.status === 200).length, 30);
  assert.equal(responses.filter(r => r.status === 429).length, 5);
  for (const response of responses) {
    if (response.status === 429) assert(Number(response.headers.get('retry-after')) > 0);
    await response.arrayBuffer();
  }
  const quotas = sql('SELECT ip_hash, count FROM lead_rate_limits');
  assert.equal(quotas.length, 1);
  assert.match(quotas[0].ip_hash, /^[a-f0-9]{64}$/);
  assert.equal(quotas[0].count, 30);
  sql("INSERT INTO lead_rate_limits VALUES ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 0, 1, 1)");
  await call(lead, { status: 429 });
  assert.equal(sql('SELECT count(*) AS n FROM lead_rate_limits WHERE expires_at = 1')[0].n, 0);
  console.log('PASS: validation, origins, byte limits, persistence, idempotency, storage failure, atomic quota, expiry');
} finally {
  sql(`DELETE FROM leads WHERE email = '${email}'`);
  sql('DELETE FROM lead_rate_limits');
}
