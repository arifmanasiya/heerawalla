# D1 Migration Guide (Sheets -> D1)

This guide migrates the legacy Google Sheets data into Cloudflare D1 and seeds it for use by the worker/admin portal. Sheets are deprecated after migration.

## 1) Create the D1 database
```bash
npx wrangler d1 create heerawalla
```

Capture the output `database_id` and add a D1 binding in:
- `workers/herawalla-email-atelier/wrangler.toml`

Example:
```toml
[[d1_databases]]
binding = "DB"
database_name = "heerawalla"
database_id = "<YOUR_DATABASE_ID>"
```

## 2) Apply schema migrations
```bash
cd workers/herawalla-email-atelier
npx wrangler d1 migrations apply heerawalla --remote
```

If you prefer local dev:
```bash
npx wrangler d1 migrations apply heerawalla --local
```

## 3) Generate seed SQL from Sheets
From repo root:
```bash
node scripts/d1/migrate-sheets-to-d1.mjs --out scripts/d1/seed
```

This uses the sheet IDs/names from `workers/herawalla-email-atelier/wrangler.toml` under `[vars]` to fetch CSV exports.

Optional flags:
- `--no-truncate` to keep existing D1 data and only insert/replace.
- `--out <dir>` to change output folder.

## 4) Load seed SQL into D1
```bash
npx wrangler d1 execute heerawalla --remote --file scripts/d1/seed/01_catalog.sql
npx wrangler d1 execute heerawalla --remote --file scripts/d1/seed/01b_catalog_notes.sql
npx wrangler d1 execute heerawalla --remote --file scripts/d1/seed/02_site_config.sql
npx wrangler d1 execute heerawalla --remote --file scripts/d1/seed/03_pricing.sql
npx wrangler d1 execute heerawalla --remote --file scripts/d1/seed/04_orders.sql
npx wrangler d1 execute heerawalla --remote --file scripts/d1/seed/05_order_details.sql
npx wrangler d1 execute heerawalla --remote --file scripts/d1/seed/06_quotes.sql
npx wrangler d1 execute heerawalla --remote --file scripts/d1/seed/07_contacts.sql
npx wrangler d1 execute heerawalla --remote --file scripts/d1/seed/08_unified_contacts.sql
```

Or run with auto-execute:
```bash
node scripts/d1/migrate-sheets-to-d1.mjs --execute --db heerawalla --remote
```

If you use a binding instead of name:
```bash
node scripts/d1/migrate-sheets-to-d1.mjs --execute --binding DB --remote
```

## 5) Validate
```bash
npx wrangler d1 execute heerawalla --remote --command "SELECT COUNT(*) FROM catalog_items;"
npx wrangler d1 execute heerawalla --remote --command "SELECT COUNT(*) FROM orders;"
```

## Notes
- The migration script converts list-like catalog fields (`metals`, `styles`, `tags`, etc.) into JSON arrays.
- `INSERT OR REPLACE` is used to support last-write-wins.
- `catalog_media` merges product and inspiration media into one table.
