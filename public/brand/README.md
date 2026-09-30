# Koola landing brand

Current identity: covered red dish, three Masara Yellow leaves, uppercase indigo KOOLA wordmark. Selected 30 September 2026.

Source package: `docs/assets/branding/leaf-dish-v1` in the shared workspace. The self-contained SVG compositions embed generated raster masters; they are not traced vector outlines. Use the supplied compositions consistently.

Run `node scripts/export-brand.cjs` from the landing service to refresh PNG favicon, Apple/app icons and the 1200×630 sharing image. Requires installed Playwright Chromium. The favicon uses `favicon.svg` with a transparent browser background; Apple/app icons retain the cream `app-icon.svg` tile. The older `make_og_assets.py` entry point delegates to this exporter.

`koola-master.png` is a historical carrier concept and is not used by the active landing UI or export script.

Palette: primary Tatashe Red #D9392B; secondary Masara Yellow #F4B324; wordmark/text Kofar Mata Indigo #1B2150; background Kasa #F6EFE4.
