PRAGMA foreign_keys = OFF;

DROP TRIGGER IF EXISTS trg_catalog_items_delete_media;

CREATE TABLE catalog_media_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_id TEXT REFERENCES catalog_items(id) ON DELETE CASCADE,
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
  catalog_media.id,
  catalog_items.id,
  catalog_media.media_id,
  catalog_media.position,
  catalog_media.is_primary,
  catalog_media.sort_order
FROM catalog_media
JOIN catalog_items
  ON catalog_items.slug = catalog_media.catalog_slug
  AND catalog_items.type = catalog_media.catalog_type;

DROP TABLE catalog_media;
ALTER TABLE catalog_media_new RENAME TO catalog_media;

CREATE INDEX IF NOT EXISTS idx_catalog_media_catalog
  ON catalog_media (catalog_id);

PRAGMA foreign_keys = ON;
