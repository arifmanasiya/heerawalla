CREATE TABLE IF NOT EXISTS catalog_stone_options (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  catalog_slug TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('center', 'accent', 'side', 'halo')),
  stone_type TEXT NOT NULL,
  ct_min REAL,
  ct_max REAL,
  count_min INTEGER,
  count_max INTEGER,
  cut TEXT,
  clarity TEXT,
  color TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (catalog_id) REFERENCES catalog_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_catalog_stone_options_catalog
  ON catalog_stone_options (catalog_id, catalog_slug);

CREATE INDEX IF NOT EXISTS idx_catalog_stone_options_role
  ON catalog_stone_options (role, stone_type);
