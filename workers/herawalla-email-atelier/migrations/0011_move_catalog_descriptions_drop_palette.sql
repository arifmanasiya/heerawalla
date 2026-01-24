PRAGMA foreign_keys = OFF;

CREATE TABLE catalog_notes_new (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  catalog_slug TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('takeaway', 'translation_note', 'description', 'long_desc')),
  note TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (catalog_id) REFERENCES catalog_items(id) ON DELETE CASCADE
);

INSERT INTO catalog_notes_new (
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
  id,
  catalog_id,
  catalog_slug,
  kind,
  note,
  sort_order,
  created_at,
  updated_at
FROM catalog_notes;

INSERT INTO catalog_notes_new (
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
  'note_desc_' || id,
  id,
  slug,
  'description',
  description,
  0,
  created_at,
  updated_at
FROM catalog_items
WHERE description IS NOT NULL
  AND trim(description) != '';

INSERT INTO catalog_notes_new (
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
  'note_long_desc_' || id,
  id,
  slug,
  'long_desc',
  long_desc,
  0,
  created_at,
  updated_at
FROM catalog_items
WHERE long_desc IS NOT NULL
  AND trim(long_desc) != '';

DROP TABLE catalog_notes;
ALTER TABLE catalog_notes_new RENAME TO catalog_notes;

CREATE INDEX IF NOT EXISTS idx_catalog_notes_catalog
  ON catalog_notes (catalog_id, catalog_slug, kind);

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
  stone_weight TEXT,
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
  stone_weight,
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
  stone_weight,
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
