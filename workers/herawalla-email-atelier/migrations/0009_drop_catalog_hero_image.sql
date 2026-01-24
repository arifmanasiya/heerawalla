PRAGMA foreign_keys = OFF;

INSERT INTO media_library (
  media_id,
  url,
  media_type,
  label,
  alt,
  description,
  created_at
)
SELECT
  'hero_' || slug,
  hero_image,
  'image',
  NULL,
  NULL,
  NULL,
  datetime('now')
FROM catalog_items
WHERE type = 'inspiration'
  AND hero_image IS NOT NULL
  AND trim(hero_image) != ''
  AND NOT EXISTS (
    SELECT 1 FROM media_library WHERE url = catalog_items.hero_image
  );

INSERT INTO catalog_media (
  catalog_type,
  catalog_slug,
  media_id,
  position,
  is_primary,
  sort_order
)
SELECT
  'inspiration',
  slug,
  (SELECT media_id FROM media_library WHERE url = catalog_items.hero_image LIMIT 1),
  'hero',
  1,
  0
FROM catalog_items
WHERE type = 'inspiration'
  AND hero_image IS NOT NULL
  AND trim(hero_image) != ''
  AND (SELECT media_id FROM media_library WHERE url = catalog_items.hero_image LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM catalog_media
    WHERE catalog_type = 'inspiration'
      AND catalog_slug = catalog_items.slug
      AND media_id = (SELECT media_id FROM media_library WHERE url = catalog_items.hero_image LIMIT 1)
  );

CREATE TABLE catalog_items_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('product', 'inspiration')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  long_desc TEXT,
  collection TEXT,
  categories TEXT,
  gender TEXT,
  styles TEXT,
  motifs TEXT,
  metals TEXT,
  stone_types TEXT,
  stone_weight TEXT,
  metal_weight TEXT,
  palette TEXT,
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
  description,
  long_desc,
  collection,
  categories,
  gender,
  styles,
  motifs,
  metals,
  stone_types,
  stone_weight,
  metal_weight,
  palette,
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
  description,
  long_desc,
  collection,
  categories,
  gender,
  styles,
  motifs,
  metals,
  stone_types,
  stone_weight,
  metal_weight,
  palette,
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
