# Quick Start
- Install: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Update `/data/products-*.csv` and `/data/site_config.sample.csv` with your data.
- (If using GitHub Pages without a custom domain) set `BASE_PATH` to your repo path, e.g. `/heerawalla`.
- Push to `main`; GitHub Actions deploys to Pages.

---

# Heerawalla - Static Jewelry Catalog (Astro + Tailwind)

This is an inspirational jewelry catalog for **heerawalla.com**, built with Astro, TypeScript, and Tailwind. Product and site configuration data are pulled at build time from CSV files in `/data`. The code is structured to swap in a real backend later (Netlify Functions) without UI rewrites.

## Features
- Build-time CSV ingest (Products + Site Config) with validation; fails build on missing columns.
- Currency toggle (USD / INR) persisted in `localStorage`.
- Pages: Home, Collections (client-side filters), Product detail (dynamic routes), About, Contact (mailto form), Policies.
- SEO: meta tags, OpenGraph, JSON-LD Product schema, sitemap, robots.txt.
- Premium minimal design: whitespace, elegant typography, subtle hover states, responsive and accessible.
- Future-ready integration layer (`src/lib/apiClient.ts`) for orders, checkout, and lead capture.

## Data shape
### Products CSVs (required columns)
Use multiple files, one per subcategory, named `products-*.csv` in `/data` (e.g., `products-men-bands.csv`, `products-women-rings.csv`).

Required columns per file:
`id, name, slug, description, collection, category, metal, price_inr_natural, price_inr_lab, is_active, is_featured, tags`

- Only rows with `is_active = TRUE` are shown. `is_featured = TRUE` drives the featured section.
- `category` should match your folder path under `public/images/products`, e.g., `women/rings` or `men/bands`.
- `price_*_lab` may be left blank if no lab-grown option.
- USD prices are derived at build time using the prior day USD/INR rate plus 5% buffer (fetched from exchangerate.host, fallback env `USDINR_RATE`).

### Site Config CSV (required columns)
`key, value`

Keys used: `meta_title, meta_description, hero_title, hero_subtitle, hero_cta_label, hero_cta_link, contact_email, about_title, about_description`

Sample files live in `/data/products.sample.csv`, `/data/products-men-bands.csv`, `/data/products-women-rings.csv`, `/data/products-women-pendants.csv`, and `/data/site_config.sample.csv`.
Optional keys: `orders_email` (used for product inquiry mailto).

## CSV data
- Products: add CSVs named `products-*.csv` in `/data` (one per subcategory). Columns described above.
- Site config: edit `/data/site_config.sample.csv` or provide your own CSV in `/data`.

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
- Push to `main`; GitHub Actions builds (`npm run build`) then deploys `dist` to Pages.
- If you use a project page (e.g., `https://username.github.io/heerawalla/`), set repo variable `BASE_PATH=/heerawalla` so asset URLs resolve; keep it `/` when using the `heerawalla.com` custom domain.
- Optionally set `SITE=https://heerawalla.com` (or your Pages URL) to override the canonical/OG base URL.
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
  images/       // hero, favicon, and product assets
data/
  products.sample.csv
  products-men-bands.csv
  products-women-rings.csv
  products-women-pendants.csv
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

## Product media folders (images & video)
- Drop media into `public/images/products/<category>/<product_id>/`, e.g. `public/images/products/women/rings/hw-002/image-1.jpg`.
- File names are free-form; we sort alphabetically. Supported images: jpg/jpeg/png/webp/avif/gif/svg. Videos: mp4/webm/mov/m4v.
- The product `id` in the CSV links to the folder; `category` can include nested paths (e.g., `men/bands`). If no media is found, the placeholder shows.
- On product pages, all images are shown first, then videos, in a swipeable horizontal gallery. List cards use the first image as the cover. If lab prices exist, a Natural/Lab toggle appears; it respects the currency toggle.
