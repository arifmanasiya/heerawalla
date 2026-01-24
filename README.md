# Quick Start
- Install: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- (If using GitHub Pages without a custom domain) set `BASE_PATH` to your repo path, e.g. `/heerawalla`.
- Push to `main`; GitHub Actions deploys the worker + admin pages to Cloudflare and the site to GitHub Pages.

---

# Heerawalla - Static Jewelry Catalog (Astro + Tailwind)

This is an inspirational jewelry catalog for **heerawalla.com**, built with Astro, TypeScript, and Tailwind. Product and site configuration data live in Cloudflare D1. Legacy CSV/Sheets data is still present for reference but is being deprecated.

## Features
- D1-backed catalog + site config with Worker endpoints for admin and runtime refresh.
- Pages: Home, Collections (client-side filters), Product detail (dynamic routes), About, Contact (mailto form), Policies.
- SEO: meta tags, OpenGraph, JSON-LD Product schema, sitemap, robots.txt.
- Premium minimal design: whitespace, elegant typography, subtle hover states, responsive and accessible.
- Future-ready integration layer (`src/lib/apiClient.ts`) for orders, checkout, and lead capture.

## Data shape (D1)
### Catalog items (products + inspirations)
Both live in the same table: `catalog_items`.

Columns:
`id, type, name, slug, categories, gender, styles, motifs, metals, stone_types, design_code, cut, clarity, color, is_active, is_featured, tags, created_at, updated_at, updated_by`

Notes:
- `type` is `product` or `inspiration`.
- List-like fields (`categories`, `styles`, `motifs`, `metals`, `tags`, etc.) are stored as JSON arrays.
- `is_active` and `is_featured` gate visibility.

### Media
- `media_library` stores media rows by `media_id`.
- `catalog_media` links media to a catalog item (by type + slug).

### Site config
- `site_config` is `key/value` with `updated_at`.

## Local development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
Legacy CSV builds will fail if required columns are missing or data is invalid.
Legacy CSV/Sheets sources are deprecated and are not used by the D1-backed workflow.

## Runtime catalog endpoint (optional)
If you want product/inspiration grids to refresh on page load without rebuilding, set:
- `PUBLIC_CATALOG_API_URL` (e.g., `https://<worker>.workers.dev/catalog`)
- `PUBLIC_CATALOG_MODE=hybrid` (set `ssr` to disable runtime refresh)

When set, list pages and detail pages refresh catalog data on page load. Set `PUBLIC_CATALOG_MODE=ssr` to disable runtime refresh everywhere.

## TODO (later)
- Add log sampling and an error-only log view in Cloudflare Workers Logs.
- Add Cloudflare cache rules for product vs editorial images (longer TTL for product imagery).

## Deploy (Cloudflare)
- Workflow: `.github/workflows/deploy.yml`
- Push to `main`; GitHub Actions deploys:
  - Worker: `workers/herawalla-email-atelier`
  - Admin worker assets: `admin-placeholder`
- GitHub secrets required:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `PUBLIC_TURNSTILE_SITE_KEY` (required for Turnstile-protected forms on the public site)
- GitHub variables required:
  - `CF_ADMIN_WORKER_NAME` (Cloudflare Worker name that serves `admin-placeholder`)

### Local deploy helper
```bash
npm run deploy -- -m "comment"
```
- Syncs worker vars from Cloudflare, commits/pushes changes, then waits for GitHub Actions to finish.
- Validation checks run after deploy unless you pass `--no-verify`.
- Set `GH_HEERAWALLA_TOKEN` (or `GH_TOKEN`) locally to allow workflow verification.
- Skip Cloudflare sync with `--no-sync`.
- Optional verification overrides:
  - `VERIFY_WORKER_URL` (defaults to `https://admin-api.heerawalla.com/health`)
  - `VERIFY_ADMIN_URL` (defaults to `https://business.heerawalla.com`)
  - `VERIFY_SITE_URL` (set if you also want to validate the public site)
- If the admin domain is behind Cloudflare Access, set `VERIFY_ADMIN_URL` to an accessible URL or use `--no-verify`.

### Sync remote worker vars into wrangler.toml
```bash
export CLOUDFLARE_API_TOKEN=your_token
export CLOUDFLARE_ACCOUNT_ID=your_account_id
npm run sync:worker-vars
```
- Pulls plain-text vars + KV + send_email bindings from Cloudflare and updates `workers/herawalla-email-atelier/wrangler.toml`.
- Uses the production environment by default; pass `--env <name>` to target another environment.

## Google Calendar + People API setup (Worker)
The concierge booking and contact sync use Google APIs via the worker at `workers/herawalla-email-atelier`.

### Enable APIs
- Google Calendar API
- People API

### OAuth consent screen + scopes
Add these scopes on the same Google Cloud project:
- `https://www.googleapis.com/auth/calendar` (concierge booking)
- `https://www.googleapis.com/auth/contacts` (People API sync)

### Generate a refresh token (OAuth Playground)
1) In Google Cloud Console, create an OAuth Client ID (Web).
2) Add `https://developers.google.com/oauthplayground` as an authorized redirect URI.
3) Open OAuth Playground, click the gear icon, and use your own OAuth credentials.
4) Authorize with the scopes above, then exchange the code for tokens.
5) Copy the refresh token.

### Set worker secrets
Set these secrets on the worker (Wrangler or Cloudflare UI):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN` (must include the Contacts scope if People API is used)
- `GOOGLE_CALENDAR_ID` (calendar to book against)

After updating secrets, redeploy the worker.

## Admin portal (business.heerawalla.com)
The admin UI is designed to talk to private Worker endpoints under `/admin/*`. Access is controlled by Cloudflare Access allowlists.

### Cloudflare Access (allowlist)
1) Create an Access Application for `business.heerawalla.com`.
2) Add an allowlist policy for admin emails.
3) Optional: apply the same Access policy to your Worker route (or call the API only from the admin UI).

### Worker env vars (admin roles)
Set comma-separated allowlists:
- `ADMIN_ALLOWLIST` (full access)
- `OPS_ALLOWLIST` (edit orders/quotes; view contacts)
- `VIEWER_ALLOWLIST` (read-only)

### Admin API endpoints (v1)
Read-only lists:
- `GET /admin/me`
- `GET /admin/orders`
- `GET /admin/quotes`
- `GET /admin/contacts` (read-only)

Common query params:
- `status`, `email`, `request_id`, `q`
- `sort` (default `created_at`), `dir` (`asc|desc`)
- `limit` (max 500), `offset`

Actions (orders/quotes):
- `POST /admin/orders/action`
- `POST /admin/quotes/action`

Body:
```json
{
  "requestId": "HW-REQ:ABC123",
  "action": "send_invoice",
  "status": "INVOICED",
  "notes": "Invoice sent via Stripe",
  "fields": { "price": "2999", "timeline": "Standard" }
}
```

Order actions: `send_invoice`, `mark_paid`, `mark_shipped`, `mark_delivered`, `cancel`, `acknowledge`  
Quote actions: `submit_quote`, `convert_to_order`, `drop`, `acknowledge`

Email endpoint:
- `POST /admin/email`

Body:
```json
{
  "to": "customer@example.com",
  "subject": "Your Heerawalla quote",
  "textBody": "Plain text version",
  "htmlBody": "<p>HTML version</p>"
}
```

Notes:
- Contacts can be updated by admin roles (status + notes).
- Orders, quotes, and contacts are stored in D1 with last-write-wins updates.

## Order confirmation flow (customer + admin)
The order confirmation flow issues a one-time token, sends a confirmation email, and routes the customer to a secure confirmation page.

### Worker env vars (confirmation)
Set these in `workers/herawalla-email-atelier/wrangler.toml` or Cloudflare:
- `ORDER_CONFIRMATION_PAGE_URL` (e.g., `https://www.heerawalla.com/order_confirmation`)
- `ORDER_CONFIRMATION_PAYMENT_URL` (template supports `{requestId}`, `{token}`, `{email}`)

### Site config (public confirmation page)
Set this key in D1 `site_config`:
- `order_confirmation_api_base=https://admin-api.heerawalla.com`

### API endpoints
Admin (requires Access):
- `POST /admin/orders/confirm` (returns `confirmationUrl` + `token`)

Customer (public, CORS-limited):
- `GET /orders/confirmation?token=...`
- `POST /orders/confirmation/confirm`
- `POST /orders/confirmation/cancel`

### Quick test
```bash
curl -X POST https://admin-api.heerawalla.com/admin/orders/confirm \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.heerawalla.com" \
  -d '{
    "requestId":"HW-REQ:ABC123",
    "changes":[{"key":"price","label":"Price","from":"$5,000","to":"$5,400"}],
    "email":"client@example.com",
    "name":"Client Name",
    "productName":"Emerald Band"
  }'
```
Open the returned `confirmationUrl` and confirm. If your `ORDER_CONFIRMATION_PAYMENT_URL` is set, the confirmation page will redirect automatically after confirmation.

## Project structure
```
src/
  pages/        // Astro pages (index, collections, product/[slug], about, contact, policies)
  components/   // Header, Footer, ProductCard, Filters, CurrencyToggle, Breadcrumbs
  layouts/      // BaseLayout
  lib/          // csvFetch, schema, products, config, apiClient (future Netlify integration)
  styles/       // global Tailwind styles
public/
  images/       // hero, favicon, and product assets
data/
  products.sample.csv
  products-men-bands.csv
  products-women-rings.csv
  products-women-pendants.csv
  site_config.sample.csv
```

## Future Netlify integration
- `src/lib/apiClient.ts` exposes `createOrder`, `startCheckout`, and `submitLead` placeholders. Point them to Netlify Functions (`/api/*`) later.
- Contact form currently uses `mailto:` but fields are ready to POST to `/api/inquiry`.

## Accessibility and performance
- Semantic HTML, focusable controls, lazy-loaded images, responsive layout.
- Tailwind not applied globally; base styles kept minimal.

## Placeholders to replace
- `/public/images/hero.svg` and `/public/images/products/placeholder.svg` with your branded assets.
- Legacy CSVs remain for reference during the migration, but D1 is the source of truth.
- Set `site` in `astro.config.mjs` to your final domain.

## Product media folders (images & video)
- Drop media into `public/images/products/<category>/<product_id>/`, e.g. `public/images/products/women/rings/hw-002/image-1.jpg`.
- File names are free-form; we sort alphabetically. Supported images: jpg/jpeg/png/webp/avif/gif/svg. Videos: mp4/webm/mov/m4v.
- The product `id` links to the folder; `category` can include nested paths (e.g., `men/bands`). If no media is found, the placeholder shows.
- On product pages, all images are shown first, then videos, in a swipeable horizontal gallery. List cards use the first image as the cover.
