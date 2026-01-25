SELECT COUNT(*) AS missing_media_id
FROM catalog_media
WHERE media_id IS NULL OR media_id = '';

SELECT COUNT(*) AS missing_library
FROM catalog_media
LEFT JOIN media_library ON media_library.media_id = catalog_media.media_id
WHERE catalog_media.media_id IS NOT NULL
  AND catalog_media.media_id <> ''
  AND media_library.media_id IS NULL;

SELECT catalog_items.slug AS catalog_slug,
       catalog_media.id,
       catalog_media.media_id,
       catalog_media.position,
       catalog_media.is_primary,
       catalog_media.sort_order
FROM catalog_media
JOIN catalog_items ON catalog_items.id = catalog_media.catalog_id
WHERE catalog_media.media_id IS NULL OR catalog_media.media_id = ''
ORDER BY catalog_items.slug, catalog_media.id
LIMIT 20;
