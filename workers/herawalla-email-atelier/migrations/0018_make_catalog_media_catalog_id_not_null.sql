PRAGMA foreign_keys = OFF;

DELETE FROM catalog_media
WHERE catalog_id IS NULL
  OR trim(catalog_id) = '';

CREATE TABLE catalog_media_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  position TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO catalog_media_new (
  id,
  catalog_id,
  media_id,
  position,
  is_primary,
  sort_order
)
SELECT
  id,
  catalog_id,
  media_id,
  position,
  is_primary,
  sort_order
FROM catalog_media;

DROP TABLE catalog_media;
ALTER TABLE catalog_media_new RENAME TO catalog_media;

CREATE INDEX IF NOT EXISTS idx_catalog_media_catalog
  ON catalog_media (catalog_id);

PRAGMA foreign_keys = ON;
