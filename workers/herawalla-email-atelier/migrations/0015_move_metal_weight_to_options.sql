PRAGMA foreign_keys = OFF;

CREATE TABLE catalog_stone_options_new (
  id TEXT PRIMARY KEY,
  catalog_id TEXT,
  catalog_slug TEXT,
  role TEXT,
  carat REAL,
  count INTEGER,
  metal_weight TEXT,
  is_primary INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO catalog_stone_options_new (
  id,
  catalog_id,
  catalog_slug,
  role,
  carat,
  count,
  metal_weight,
  is_primary,
  notes,
  created_at,
  updated_at
)
SELECT
  id,
  catalog_id,
  catalog_slug,
  role,
  carat,
  count,
  NULL,
  is_primary,
  notes,
  created_at,
  updated_at
FROM catalog_stone_options;

INSERT INTO catalog_stone_options_new (
  id,
  catalog_id,
  catalog_slug,
  role,
  carat,
  count,
  metal_weight,
  is_primary,
  notes,
  created_at,
  updated_at
)
SELECT
  'metalopt_' || lower(hex(randomblob(8))),
  id,
  slug,
  'Metal',
  NULL,
  NULL,
  metal_weight,
  1,
  'metal',
  created_at,
  updated_at
FROM catalog_items
WHERE metal_weight IS NOT NULL
  AND trim(metal_weight) != '';

DROP TABLE catalog_stone_options;
ALTER TABLE catalog_stone_options_new RENAME TO catalog_stone_options;

CREATE INDEX IF NOT EXISTS idx_catalog_stone_options_catalog
  ON catalog_stone_options (catalog_id, catalog_slug);

CREATE INDEX IF NOT EXISTS idx_catalog_stone_options_role
  ON catalog_stone_options (role);

CREATE TABLE catalog_items_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('product', 'inspiration')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  categories TEXT,
  gender TEXT,
  styles TEXT,
  motifs TEXT,
  metals TEXT,
  stone_types TEXT,
  design_code TEXT,
  cut TEXT,
  clarity TEXT,
  color TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

INSERT INTO catalog_items_new (
  id,
  type,
  name,
  slug,
  categories,
  gender,
  styles,
  motifs,
  metals,
  stone_types,
  design_code,
  cut,
  clarity,
  color,
  is_active,
  is_featured,
  tags,
  created_at,
  updated_at,
  updated_by
)
SELECT
  id,
  type,
  name,
  slug,
  categories,
  gender,
  styles,
  motifs,
  metals,
  stone_types,
  design_code,
  cut,
  clarity,
  color,
  is_active,
  is_featured,
  tags,
  created_at,
  updated_at,
  updated_by
FROM catalog_items;

DROP TABLE catalog_items;
ALTER TABLE catalog_items_new RENAME TO catalog_items;

CREATE INDEX IF NOT EXISTS idx_catalog_items_type_active
  ON catalog_items (type, is_active, is_featured);

PRAGMA foreign_keys = ON;
