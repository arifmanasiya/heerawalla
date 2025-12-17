# Quick Start
- Install: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Publish Google Sheets as CSV and set `PRODUCTS_CSV_URL` and `SITE_CONFIG_CSV_URL` GitHub repo variables.
- (If using GitHub Pages without a custom domain) set `BASE_PATH` to your repo path, e.g. `/heerawalla`.
- Push to `main`; GitHub Actions deploys to Pages.

---

# Heerawalla - Static Jewelry Catalog (Astro + Tailwind)

This is a static, Tiffany-inspired jewelry catalog for **heerawalla.com**, built with Astro, TypeScript, and Tailwind. Product and site configuration data are pulled at build time from Google Sheets published as public CSV. The code is structured to swap in a real backend later (Netlify Functions) without UI rewrites.

## Features
- Build-time CSV ingest (Products + Site Config) with validation; fails build on missing columns.
- Currency toggle (USD / INR) persisted in `localStorage`.
- Pages: Home, Collections (client-side filters), Product detail (dynamic routes), About, Contact (mailto form), Policies.
- SEO: meta tags, OpenGraph, JSON-LD Product schema, sitemap, robots.txt.
- Premium minimal design: whitespace, elegant typography, subtle hover states, responsive and accessible.
- Future-ready integration layer (`src/lib/apiClient.ts`) for orders, checkout, and lead capture.

## Data shape
### Products CSV (required columns)
`id, name, slug, description, collection, category, metal, price_usd, price_inr, image, is_active, is_featured, tags`

Only rows with `is_active = TRUE` are shown. `is_featured = TRUE` drives the featured section.

### Site Config CSV (required columns)
`key, value`

Keys used: `meta_title, meta_description, hero_title, hero_subtitle, hero_cta_label, hero_cta_link, contact_email, about_title, about_description`

Sample files live in `/data/products.sample.csv` and `/data/site_config.sample.csv`.

## Using Google Sheets as CSV
1. Create a Google Sheet tab for **Products** with the columns above.
2. In Sheets: File > Share > Publish to the web -> pick the tab -> format CSV -> Publish.
3. Copy the generated CSV URL (it will contain `/pub-output=csv`).
4. Repeat for the **Site Config** tab.
5. In your GitHub repo, add repository variables (Settings -> Secrets and variables -> Actions -> Variables):
   - `PRODUCTS_CSV_URL = https://docs.google.com/spreadsheets/.../pub-output=csv`
   - `SITE_CONFIG_CSV_URL = https://docs.google.com/spreadsheets/.../pub-output=csv`

If these are not set, the build falls back to the sample CSVs in `/data`.

## Local development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
Build will fail if required CSV columns are missing or data is invalid.

## Deploy (GitHub Pages)
- Workflow: `.github/workflows/deploy.yml`
- Push to `main`; GitHub Actions builds (`npm run build`) with `PRODUCTS_CSV_URL` and `SITE_CONFIG_CSV_URL` repo variables, then deploys `dist` to Pages.
- If you use a project page (e.g., `https://username.github.io/heerawalla/`), set repo variable `BASE_PATH=/heerawalla` so asset URLs resolve; keep it `/` when using the `heerawalla.com` custom domain.
- Optionally set `SITE=https://heerawalla.com` to override the canonical/OG base URL.
- Configure your Pages custom domain (optional) to `heerawalla.com`.

## Project structure
```
src/
  pages/        // Astro pages (index, collections, product/[slug], about, contact, policies)
  components/   // Header, Footer, ProductCard, Filters, CurrencyToggle, Breadcrumbs
  layouts/      // BaseLayout
  lib/          // csvFetch, schema, products, config, apiClient (future Netlify integration)
  styles/       // global Tailwind styles
public/
  images/       // placeholders; replace with real assets
data/
  products.sample.csv
  site_config.sample.csv
```

## Currency toggle implementation
- Default currency: USD.
- Prices rendered with `data-price-usd` and `data-price-inr` attributes.
- `CurrencyToggle` dispatches a custom `hw:currency:update` event; BaseLayout listens, formats with `Intl.NumberFormat`, and persists to `localStorage`.

## Future Netlify integration
- `src/lib/apiClient.ts` exposes `createOrder`, `startCheckout`, and `submitLead` placeholders. Point them to Netlify Functions (`/api/*`) later.
- Contact form currently uses `mailto:` but fields are ready to POST to `/api/inquiry`.

## Accessibility and performance
- Semantic HTML, focusable controls, lazy-loaded images, responsive layout.
- Tailwind not applied globally; base styles kept minimal.

## Placeholders to replace
- `/public/images/hero.svg` and `/public/images/products/placeholder.svg` with your branded assets.
- Update sample CSVs with your products and site copy.
- Set `site` in `astro.config.mjs` to your final domain.
