PRAGMA foreign_keys = OFF;

CREATE TABLE catalog_metal_options_new (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  metal_weight TEXT,
  is_primary INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

WITH RECURSIVE
base AS (
  SELECT
    id,
    catalog_id,
    metal_weight,
    created_at,
    updated_at
  FROM catalog_metal_options
  WHERE metal_weight IS NOT NULL
    AND trim(metal_weight) != ''
),
parts AS (
  SELECT
    id,
    catalog_id,
    metal_weight AS original_weight,
    created_at,
    updated_at,
    trim(substr(metal_weight, 1, instr(metal_weight || '|', '|') - 1)) AS item,
    substr(metal_weight || '|', instr(metal_weight || '|', '|') + 1) AS rest,
    1 AS idx
  FROM base
  UNION ALL
  SELECT
    id,
    catalog_id,
    original_weight,
    created_at,
    updated_at,
    trim(substr(rest, 1, instr(rest, '|') - 1)) AS item,
    substr(rest, instr(rest, '|') + 1) AS rest,
    idx + 1
  FROM parts
  WHERE rest != ''
)
INSERT INTO catalog_metal_options_new (
  id,
  catalog_id,
  metal_weight,
  is_primary,
  notes,
  created_at,
  updated_at
)
SELECT
  CASE
    WHEN instr(original_weight, '|') > 0 THEN id || '_' || idx
    ELSE id
  END,
  catalog_id,
  item,
  CASE WHEN idx = 1 THEN 1 ELSE 0 END,
  CASE idx
    WHEN 1 THEN 'small'
    WHEN 2 THEN 'medium'
    WHEN 3 THEN 'large'
    WHEN 4 THEN 'xlarge'
    WHEN 5 THEN 'xxlarge'
    WHEN 6 THEN 'xxxlarge'
    WHEN 7 THEN 'xxxxlarge'
    ELSE 'xxxxlarge'
  END,
  created_at,
  updated_at
FROM parts
WHERE item != '';

DROP TABLE catalog_metal_options;
ALTER TABLE catalog_metal_options_new RENAME TO catalog_metal_options;

CREATE INDEX IF NOT EXISTS idx_catalog_metal_options_catalog
  ON catalog_metal_options (catalog_id);

PRAGMA foreign_keys = ON;
