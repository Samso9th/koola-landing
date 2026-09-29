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

Create the intended Cloudflare D1 database, replace the placeholder ID in `wrangler.jsonc`, apply remote migrations, then run `npm run deploy`. Full commands and API contract are in [Worker documentation](docs/leads-worker.md). Nothing has been deployed. The core backend's Docker/Coolify service is a separate future implementation.

## Review before launch

- Have a Hausa speaker review the translation.
- Set signup retention and privacy contact details.
- Produce vector/small-size brand exports matching the selected master. Current displays reuse the original raster geometry.
- Configure the domain and verify signup on the deployed origin.

Food images illustrate the upcoming service; they do not depict a verified vendor menu. App, WhatsApp and Telegram channels are marked coming soon. GSAP provides depth, tilt and plate motion; there is no Three.js scene. Motion can be paused and respects reduced-motion preferences.
