# Live waitlist verification

Verified 30 September 2026, 10:13–10:15 UTC, against https://koola.store using curl and the existing authenticated Wrangler `LEADS_DB` remote binding (`koola-leads`). No deployment or API/admin code changes were made.

## Observed routes

| Request | Observed response |
| --- | --- |
| `HEAD /` | HTTP 200, `text/html`, Cloudflare |
| `GET /api/health` | HTTP 200, `{"ok":true}` |
| `POST /api/leads` with same-origin JSON QA payload | HTTP 200, `{"ok":true}` |
| `GET /api/leads` | HTTP 405, `Allow: POST`, `{"ok":false,"error":"method_not_allowed"}` |
| `GET /api/qa-route-check` | HTTP 404, `{"ok":false,"error":"not_found"}` |

API responses included `Cache-Control: no-store` and JSON content type. These responses demonstrate that API requests reach the deployed Worker rather than a static HTML fallback. Initial sandbox DNS resolution failed; curl succeeded with approved network access, so a web fallback was unnecessary.

## Persistence and cleanup

One authorized synthetic signup was submitted:

- Name: `KOOLA QA SYNTHETIC DELETE 853d9b8da6af`
- Email: `koola-qa-e5c4a62dbb034381ab0e83a5d3b6c5fc@example.com`
- Phone input: `08000000000` (synthetic test data)
- City: `Kano`; role: `customer`; consent: `true`; honeypot: empty.

Remote D1 returned exactly one matching row: ID `1`, phone normalized to `+2348000000000`, consent `1`, creation timestamp `2026-09-30T10:14:57.548Z`. Cleanup matched that ID plus the exact name, email, normalized phone, city and role. D1 reported `changes: 1`, `rows_written: 1`. A subsequent identical SELECT returned an empty result set with zero rows read/written. No other leads or quota rows were manually removed.

This verifies the live API/storage path for one customer signup. A browser form submission and every role/city combination were not tested during this check.

## Favicon verification

The deployed homepage references `/brand/favicon.svg` and `/brand/favicon.png`, plus the 192px app icon and Apple touch icon. The downloaded live SVG still contained the cream rectangle at verification time. Local favicon changes have **not been deployed**.

Locally, both source favicon SVGs have no background rectangle. The exporter renders `favicon.svg` with a transparent body and `omitBackground: true`. Chromium produced a 32×32 PNG with alpha range 0–254 and 557 fully transparent pixels out of 1,024. The Apple touch icon, 192px/512px app icons and sharing image have alpha 255 throughout and are byte-for-byte unchanged after export.

Refreshed browser-rendered previews: `landing/artifacts/favicon-preview.png` and `docs/assets/branding/leaf-dish-v1/preview.png`. The favicon comparison shows the SVG and PNG on white, indigo and checkerboard backgrounds. No authentication or cleanup blocker remains; publishing the transparent favicon requires a later deployment.
