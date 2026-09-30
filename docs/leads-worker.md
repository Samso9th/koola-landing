# Landing signup Worker

The landing Worker serves the static site and accepts same-origin `POST /api/leads`. It validates and normalizes each signup, then sends it to `https://api.koola.store/api/v1/leads`. PostgreSQL is the only waitlist database after cutover. The Worker has no D1 binding or Cloudflare database credential.

`GET /api/health` checks API readiness. A failed API request returns a generic 503 to the visitor, so the page never claims a signup was saved when it was not. The API applies Redis rate limiting and deduplicates by normalized email, city and role.

## Local verification

```sh
npm ci
npm run typecheck
npm run test:leads
npm run build
```

`test:leads` mocks the upstream API and covers success, bad input and outages. For a full test after deployment, submit a synthetic lead through the landing form, confirm it in the admin waitlist, then remove that exact test row using a controlled database operation.

## Cutover order

1. Deploy and migrate the API, then verify `https://api.koola.store/health/ready`.
2. Export any real records from the old landing D1 `leads` table. Import them into PostgreSQL using the API's `import:waitlist:prod` script, and compare counts.
3. Deploy this landing Worker. Its `API_ORIGIN` is set in `wrangler.jsonc` to `https://api.koola.store`.
4. Export and import once more just after cutover to catch any signups submitted during the first export. The importer deduplicates them.
5. Test `https://koola.store/api/health` and a signup through the page. Check that the record appears in the PostgreSQL-backed admin console.

The old D1 database remains untouched by this code change. The previously deployed Worker continues to use D1 until you deploy the new build.
