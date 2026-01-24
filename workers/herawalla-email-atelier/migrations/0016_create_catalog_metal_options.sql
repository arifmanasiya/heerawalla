PRAGMA foreign_keys = OFF;

CREATE TABLE catalog_metal_options (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  metal_weight TEXT,
  is_primary INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO catalog_metal_options (
  id,
  catalog_id,
  metal_weight,
  is_primary,
  notes,
  created_at,
  updated_at
)
SELECT
  id,
  catalog_id,
  metal_weight,
  is_primary,
  notes,
  created_at,
  updated_at
FROM catalog_stone_options
WHERE lower(role) = 'metal'
  AND metal_weight IS NOT NULL
  AND trim(metal_weight) != '';

CREATE TABLE catalog_stone_options_new (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  role TEXT,
  carat REAL,
  count INTEGER,
  is_primary INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO catalog_stone_options_new (
  id,
  catalog_id,
  role,
  carat,
  count,
  is_primary,
  notes,
  created_at,
  updated_at
)
SELECT
  id,
  catalog_id,
  role,
  carat,
  count,
  is_primary,
  notes,
  created_at,
  updated_at
FROM catalog_stone_options
WHERE lower(role) != 'metal';

DROP TABLE catalog_stone_options;
ALTER TABLE catalog_stone_options_new RENAME TO catalog_stone_options;

CREATE INDEX IF NOT EXISTS idx_catalog_stone_options_catalog
  ON catalog_stone_options (catalog_id);

CREATE INDEX IF NOT EXISTS idx_catalog_stone_options_role
  ON catalog_stone_options (role);

CREATE INDEX IF NOT EXISTS idx_catalog_metal_options_catalog
  ON catalog_metal_options (catalog_id);

PRAGMA foreign_keys = ON;
