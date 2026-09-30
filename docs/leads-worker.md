# Landing lead Worker

This Worker owns only landing leads and static exports. It has no core API dependency or authentication secret. `wrangler.jsonc` contains the existing remote `LEADS_DB` binding. The live origin passed health, synthetic signup, persistence and exact cleanup checks on 30 September 2026; see [live verification evidence](live-waitlist-verification.md).

## Integration

Dependencies and preview scripts are included. Next static export produces `out/`. Run commands below from `landing/`. Do not add a remote D1 binding for local testing.

## Local migration and preview

Use one explicit persistence directory for migrations, preview, and tests. The suite resets quota rows and temporarily renames the leads table to verify failure handling, so this directory must be dedicated to tests. Do not use a valuable local database or run other requests during the suite.

```sh
npm run build
npx wrangler d1 migrations apply LEADS_DB --local --persist-to .wrangler/leads-test
npx wrangler d1 migrations list LEADS_DB --local --persist-to .wrangler/leads-test
npm run worker:preview -- --persist-to .wrangler/leads-test
```

Leave preview running. In a second terminal, from `landing/`, the exact test command is:

```sh
node scripts/test-leads.mjs
```

Alternatively launch preview directly with `npx wrangler dev --port 8787 --persist-to .wrangler/leads-test`. The script requires Node 20+ and locally installed Wrangler; it does not download dependencies or launch preview. Optional `LEADS_TEST_URL` (localhost only) and `LEADS_TEST_STATE` override the URL and persistence directory together. The SQL checks use `--local` exclusively. Synthetic leads are removed after the test. If the process is interrupted during its failure test, restore the table with:

```sh
npx wrangler d1 execute LEADS_DB --local --persist-to .wrangler/leads-test --command 'ALTER TABLE leads_test_unavailable RENAME TO leads'
```

To exercise missing binding manually, use a separate temporary Wrangler configuration without `d1_databases`; both health and otherwise valid submissions must return 503. The automated suite tests the related real storage failure using a missing table.

## Contract

`POST /api/leads`, `Content-Type: application/json`, at most 4096 UTF-8 bytes, including streamed bodies:

```json
{"name":"Amina Musa","email":"amina@example.com","phone":"08031234567","city":"Kano","role":"customer","consent":true,"website":""}
```

All fields are required; unknown fields are rejected. Names are 2–120 characters after trim, with a 120-character raw limit, at least one Unicode letter, no controls or angle brackets; single names and business names are accepted for every role. Email is ASCII, at most 254 characters, local part at most 64, trimmed and lowercased. Phone input is at most 32 characters; spaces, parentheses and hyphens are accepted. Nigerian mobile numbers beginning 07/08/09, 2347/2348/2349, or +2347/+2348/+2349 normalize to +234 plus ten digits. This is syntax validation, not proof of number ownership or carrier allocation. City is exactly Kano or Katsina. Role is customer, vendor, rider, or affiliate. Consent must be boolean true; the website honeypot must be exactly empty.

Success is always HTTP 200 with exactly `{"ok":true}`, only after a successful D1 insert or conflict no-op. The unique key is normalized email + role + city. Retries preserve the original contact details and timestamp. No endpoint returns stored contacts or distinguishes duplicate submissions.

Errors use `{"ok":false,"error":"code"}`: 400 invalid JSON/lead; 403 disallowed Origin; 413 oversized body; 415 wrong media type/content encoding; 429 quota exceeded with Retry-After; 503 missing/unavailable database or failed operation. Unknown API routes return 404; unsupported methods, including OPTIONS, return 405 with Allow. Explicit Origin must equal the request URL origin; missing Origin is accepted for non-browser clients. Cross-site Fetch Metadata is rejected. No CORS headers are granted. Origin checks do not authenticate clients.

`GET /api/health` checks both D1 tables and returns only `{"ok":true}` or a generic 503. API responses include no-store, nosniff, frame denial, restrictive CSP, referrer policy, and HSTS. Static assets are served asset-first and their security headers should be supplied by the static export integration; these JSON CSP headers must not be applied to Next HTML.

## Quota and storage

Each IP gets 30 eligible POST attempts per fixed ten-minute window, including invalid payloads and duplicate submissions. Requests rejected for Origin/media type do not reach D1. The atomic upsert caps concurrent attempts. Cloudflare supplies CF-Connecting-IP at the edge; no X-Forwarded-For is trusted. Missing IPs share a fallback bucket. Do not place an untrusted proxy in front that can forge the edge header.

Only SHA-256 of bucket timestamp + IP is stored, never the raw IP. Including the bucket limits correlation across windows; this unkeyed hash is pseudonymous and is not resistant to enumerating IP addresses. It requires no secret. Expired counters are deleted via an indexed query on each eligible POST; idle databases retain expired hashes until the next eligible request. Fixed windows permit bursts across a boundary and shared networks share quotas. Lead rows intentionally retain consent and server-generated creation time; no lead retention/deletion policy is automated here.

## Deployment to a new environment

```sh
npx wrangler d1 create koola-leads
```

For a new environment only, set database_id in its Wrangler configuration to the returned ID, then:

```sh
npx wrangler d1 migrations apply LEADS_DB --remote
npm run build
npx wrangler deploy
```

Run these only for the intended Cloudflare account/database. Local migrations never migrate production. Apply migrations before deploying the Worker; confirm health on the deployed origin. The existing production database was verified through its configured binding; this verification created no database and deployed no changes.

Official references: [D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), and [Workers static assets bindings and routing](https://developers.cloudflare.com/workers/static-assets/binding/).
