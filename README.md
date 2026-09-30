# Koola landing

Next.js static export with GSAP motion and a Cloudflare Worker/D1 signup endpoint. English and Hausa copy; Kano and Katsina; customer, vendor, rider and affiliate interest forms. This service is independent of the future core API.

## Run

Use Node 22 or newer.

```sh
npm ci
npm run build
npm run db:local
npm run preview
```

Open http://localhost:8787. `npm run dev` supports UI development, but signup needs the Worker preview. Fonts are bundled locally. Media was generated with GPT Image; the selected logo source is reused unchanged.

## Verify

```sh
npm run typecheck
npm run build
npx playwright install chromium
```

For integration tests, follow [isolated database setup](docs/leads-worker.md), then run `npm run test:leads` followed by `npm run test:ui`. Do not run these against a database holding real signups. Screenshots appear in `artifacts/`.

## Deploy

The landing is live at https://koola.store, and `wrangler.jsonc` contains the existing `LEADS_DB` binding. Live health, signup persistence and exact QA cleanup were verified on 30 September 2026; see [verification evidence](docs/live-waitlist-verification.md). Deployment commands and the API contract are in [Worker documentation](docs/leads-worker.md). This verification did not deploy changes.

## Review before launch

- Have a Hausa speaker review the translation.
- Set signup retention and privacy contact details.
- Produce vector/small-size brand exports matching the selected master. Current displays reuse the original raster geometry.
- Repeat live signup verification after future routing or storage changes.

Food images illustrate the upcoming service; they do not depict a verified vendor menu. App, WhatsApp and Telegram channels are marked coming soon. GSAP provides depth, tilt and plate motion; there is no Three.js scene. Motion can be paused and respects reduced-motion preferences.
