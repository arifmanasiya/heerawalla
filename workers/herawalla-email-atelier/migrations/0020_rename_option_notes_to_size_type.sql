CREATE TABLE catalog_stone_options_new (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  role TEXT,
  carat REAL,
  count INTEGER,
  is_primary INTEGER NOT NULL DEFAULT 0,
  size_type TEXT,
  created_at TEXT,
  updated_at TEXT
);

INSERT INTO catalog_stone_options_new (
  id,
  catalog_id,
  role,
  carat,
  count,
  is_primary,
  size_type,
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
FROM catalog_stone_options;

DROP TABLE catalog_stone_options;
ALTER TABLE catalog_stone_options_new RENAME TO catalog_stone_options;

CREATE INDEX IF NOT EXISTS idx_catalog_stone_options_catalog
  ON catalog_stone_options (catalog_id);
CREATE INDEX IF NOT EXISTS idx_catalog_stone_options_role
  ON catalog_stone_options (role);

CREATE TABLE catalog_metal_options_new (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  metal_weight TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  size_type TEXT,
  created_at TEXT,
  updated_at TEXT
);

INSERT INTO catalog_metal_options_new (
  id,
  catalog_id,
  metal_weight,
  is_primary,
  size_type,
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
FROM catalog_metal_options;

DROP TABLE catalog_metal_options;
ALTER TABLE catalog_metal_options_new RENAME TO catalog_metal_options;

CREATE INDEX IF NOT EXISTS idx_catalog_metal_options_catalog
  ON catalog_metal_options (catalog_id);
