# noterender — Cloudflare deployment

The app now runs 100% on Cloudflare (no VPS/backend).

## Where things live

| Piece | URL |
|---|---|
| Frontend (Vue 2 SPA) | https://noterender-7bc.pages.dev |
| Backend API (Worker + D1) | https://noterender-api.ddenzyl.workers.dev |

## Structure

- `worker/` — the Cloudflare Worker that replaces the old Symfony backend
  - `src/index.ts` — full API (auth, projects, shoutouts, Stripe checkout/webhook, waitlist)
  - `migrations/` — D1 schema
  - `wrangler.toml` — worker config + D1 binding
- `.env.production` — `VUE_APP_API_URL` pointing at the Worker

## Deploy commands (from repo root)

```sh
# backend
cd worker && npx wrangler d1 migrations apply noterender-db --remote && npx wrangler deploy

# frontend
NODE_ENV=production npx vue-cli-service build
cd worker && npx wrangler pages deploy ../dist --project-name=noterender --branch=main
```

## Not done yet (blockers)

- **Stripe is CONFIGURED** (verified live 2026-09-11): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` set as Worker secrets; `APP_URL` var = `https://noterender-7bc.pages.dev`.
  Monthly = `price_1UEWk5CM0zldMl0EbmguNhaM` (€99/mo), Yearly = `price_1UEWkfCM0zldMl0ERfW2anor` (€990/yr).
  Webhook endpoint: `https://noterender-api.ddenzyl.workers.dev/api/stripe/webhook`
  (events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted).
  Checkout session + webhook signature verification both tested live.
- **Custom domain not added.** `noterender.denzyl.io` / `api.noterender.denzyl.io` are not
  zones on this Cloudflare account. To use them: add the domain to Cloudflare (DNS), then
  `wrangler pages` custom domain + `wrangler domains` for the worker, and rebuild the
  frontend with the custom `VUE_APP_API_URL`.
- **RTMP/TikTok streaming / relay was dropped** by design (browser-source overlays replace it;
  OBS pushes to Twitch/YouTube directly). The dead `Streaming.js` code path remains but is unused.