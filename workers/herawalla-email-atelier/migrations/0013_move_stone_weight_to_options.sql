PRAGMA foreign_keys = OFF;

WITH RECURSIVE
base AS (
  SELECT
    id AS catalog_id,
    slug AS catalog_slug,
    stone_weight,
    created_at,
    updated_at
  FROM catalog_items
  WHERE stone_weight IS NOT NULL
    AND trim(stone_weight) != ''
),
groups AS (
  SELECT
    catalog_id,
    catalog_slug,
    created_at,
    updated_at,
    trim(substr(stone_weight, 1, instr(stone_weight || '|', '|') - 1)) AS grp,
    substr(stone_weight || '|', instr(stone_weight || '|', '|') + 1) AS rest,
    1 AS size_idx
  FROM base
  UNION ALL
  SELECT
    catalog_id,
    catalog_slug,
    created_at,
    updated_at,
    trim(substr(rest, 1, instr(rest, '|') - 1)) AS grp,
    substr(rest, instr(rest, '|') + 1) AS rest,
    size_idx + 1
  FROM groups
  WHERE rest != ''
),
items AS (
  SELECT
    catalog_id,
    catalog_slug,
    created_at,
    updated_at,
    size_idx,
    trim(substr(grp, 1, instr(grp || ',', ',') - 1)) AS item,
    substr(grp || ',', instr(grp || ',', ',') + 1) AS rest
  FROM groups
  WHERE grp != ''
  UNION ALL
  SELECT
    catalog_id,
    catalog_slug,
    created_at,
    updated_at,
    size_idx,
    trim(substr(rest, 1, instr(rest, ',') - 1)) AS item,
    substr(rest, instr(rest, ',') + 1) AS rest
  FROM items
  WHERE rest != ''
),
parsed AS (
  SELECT
    catalog_id,
    catalog_slug,
    created_at,
    updated_at,
    size_idx,
    trim(replace(replace(item, 'X', 'x'), '×', 'x')) AS item_clean
  FROM items
  WHERE item != ''
),
split AS (
  SELECT
    catalog_id,
    catalog_slug,
    created_at,
    updated_at,
    size_idx,
    trim(substr(item_clean, 1, instr(item_clean, 'x') - 1)) AS carat_str,
    trim(substr(item_clean, instr(item_clean, 'x') + 1)) AS count_str
  FROM parsed
  WHERE instr(item_clean, 'x') > 0
)
INSERT INTO catalog_stone_options (
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
  'stoneopt_' || lower(hex(randomblob(8))),
  catalog_id,
  catalog_slug,
  'Accent',
  NULL,
  CAST(carat_str AS REAL),
  CAST(count_str AS INTEGER),
  NULL,
  NULL,
  NULL,
  CASE WHEN size_idx = 1 THEN 1 ELSE 0 END,
  CASE size_idx
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
FROM split
WHERE carat_str != ''
  AND count_str != '';

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
  metal_weight TEXT,
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
  metal_weight,
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
  metal_weight,
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
