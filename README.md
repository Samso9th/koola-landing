# Koola landing

Next.js static export with GSAP motion and a Cloudflare Worker signup proxy. The Worker sends waitlist signups to the Koola API's PostgreSQL database. It has no D1 binding.

```sh
npm ci
npm run typecheck
npm run test:leads
npm run build
npm run preview
```

The production `API_ORIGIN` in `wrangler.jsonc` is `https://api.koola.store`. The founder owns deployment. Deploy and verify the API first, transfer any old D1 signups, then deploy this landing update. See [Worker cutover](docs/leads-worker.md) and [historical live D1 verification](docs/live-waitlist-verification.md).

English and Hausa copy cover Kano and Katsina. Fonts are bundled locally, and food media was generated for the brand. The favicon is the icon on a transparent background. App, WhatsApp and Telegram channels are marked coming soon; Telegram is last in the product roadmap.
