PRAGMA foreign_keys = OFF;

CREATE TABLE catalog_stone_options_new (
  id TEXT PRIMARY KEY,
  catalog_id TEXT,
  catalog_slug TEXT,
  role TEXT,
  stone_type TEXT,
  carat REAL,
  count INTEGER,
  cut TEXT,
  clarity TEXT,
  color TEXT,
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
  stone_type,
  carat,
  count,
  cut,
  clarity,
  color,
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
  stone_type,
  COALESCE(ct_max, ct_min),
  COALESCE(count_max, count_min),
  cut,
  clarity,
  color,
  is_primary,
  notes,
  created_at,
  updated_at
FROM catalog_stone_options;

DROP TABLE catalog_stone_options;
ALTER TABLE catalog_stone_options_new RENAME TO catalog_stone_options;

CREATE INDEX IF NOT EXISTS idx_catalog_stone_options_catalog
  ON catalog_stone_options (catalog_id, catalog_slug);

CREATE INDEX IF NOT EXISTS idx_catalog_stone_options_role
  ON catalog_stone_options (role, stone_type);

PRAGMA foreign_keys = ON;
