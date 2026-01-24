PRAGMA foreign_keys = OFF;

CREATE TABLE catalog_items_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('product', 'inspiration')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_desc TEXT,
  long_desc TEXT,
  hero_image TEXT,
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
  cut_range TEXT,
  clarity TEXT,
  clarity_range TEXT,
  color TEXT,
  color_range TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS catalog_notes (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  catalog_slug TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('takeaway', 'translation_note')),
  note TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (catalog_id) REFERENCES catalog_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_catalog_notes_catalog
  ON catalog_notes (catalog_id, catalog_slug, kind);

INSERT INTO catalog_notes (
  id,
  catalog_id,
  catalog_slug,
  kind,
  note,
  sort_order,
  created_at,
  updated_at
)
SELECT
  'note_' || lower(hex(randomblob(8))),
  c.id,
  c.slug,
  'takeaway',
  t.value,
  CAST(t.key AS INTEGER),
  c.created_at,
  c.updated_at
FROM catalog_items c, json_each(c.takeaways) AS t
WHERE c.takeaways IS NOT NULL
  AND trim(c.takeaways) != ''
  AND json_valid(c.takeaways);

INSERT INTO catalog_notes (
  id,
  catalog_id,
  catalog_slug,
  kind,
  note,
  sort_order,
  created_at,
  updated_at
)
SELECT
  'note_' || lower(hex(randomblob(8))),
  c.id,
  c.slug,
  'takeaway',
  c.takeaways,
  0,
  c.created_at,
  c.updated_at
FROM catalog_items c
WHERE c.takeaways IS NOT NULL
  AND trim(c.takeaways) != ''
  AND NOT json_valid(c.takeaways);

INSERT INTO catalog_notes (
  id,
  catalog_id,
  catalog_slug,
  kind,
  note,
  sort_order,
  created_at,
  updated_at
)
SELECT
  'note_' || lower(hex(randomblob(8))),
  c.id,
  c.slug,
  'translation_note',
  t.value,
  CAST(t.key AS INTEGER),
  c.created_at,
  c.updated_at
FROM catalog_items c, json_each(c.translation_notes) AS t
WHERE c.translation_notes IS NOT NULL
  AND trim(c.translation_notes) != ''
  AND json_valid(c.translation_notes);

INSERT INTO catalog_notes (
  id,
  catalog_id,
  catalog_slug,
  kind,
  note,
  sort_order,
  created_at,
  updated_at
)
SELECT
  'note_' || lower(hex(randomblob(8))),
  c.id,
  c.slug,
  'translation_note',
  c.translation_notes,
  0,
  c.created_at,
  c.updated_at
FROM catalog_items c
WHERE c.translation_notes IS NOT NULL
  AND trim(c.translation_notes) != ''
  AND NOT json_valid(c.translation_notes);

WITH normalized AS (
  SELECT
    *,
    CASE
      WHEN categories IS NULL OR trim(categories) = '' THEN ''
      WHEN json_valid(categories) THEN json_extract(categories, '$[0]')
      ELSE categories
    END AS category_raw
  FROM catalog_items
),
cleaned AS (
  SELECT
    *,
    CASE
      WHEN instr(category_raw, '/') > 0 THEN substr(category_raw, instr(category_raw, '/') + 1)
      ELSE category_raw
    END AS category_clean,
    CASE
      WHEN instr(category_raw, '/') > 0 THEN substr(category_raw, 1, instr(category_raw, '/') - 1)
      ELSE ''
    END AS category_gender
  FROM normalized
)
INSERT INTO catalog_items_new (
  id,
  type,
  name,
  slug,
  description,
  short_desc,
  long_desc,
  hero_image,
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
  cut_range,
  clarity,
  clarity_range,
  color,
  color_range,
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
  short_desc,
  long_desc,
  hero_image,
  collection,
  CASE
    WHEN json_valid(categories) THEN json_array(category_clean)
    WHEN category_clean IS NOT NULL AND trim(category_clean) != '' THEN category_clean
    ELSE categories
  END AS categories,
  CASE
    WHEN gender IS NOT NULL AND trim(gender) != '' THEN gender
    WHEN category_gender != '' THEN category_gender
    ELSE gender
  END AS gender,
  styles,
  motifs,
  metals,
  stone_types,
  stone_weight,
  metal_weight,
  palette,
  design_code,
  cut,
  cut_range,
  clarity,
  clarity_range,
  color,
  color_range,
  is_active,
  is_featured,
  tags,
  created_at,
  updated_at,
  updated_by
FROM cleaned;

DROP TABLE catalog_items;
ALTER TABLE catalog_items_new RENAME TO catalog_items;

CREATE INDEX IF NOT EXISTS idx_catalog_items_type_active
  ON catalog_items (type, is_active, is_featured);

PRAGMA foreign_keys = ON;
