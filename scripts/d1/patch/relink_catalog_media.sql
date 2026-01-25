UPDATE catalog_media
SET media_id = (
  SELECT c2.media_id
  FROM catalog_media AS c2
  WHERE c2.catalog_id = catalog_media.catalog_id
    AND c2.media_id IS NOT NULL
    AND c2.media_id <> ''
  ORDER BY
    CASE WHEN c2.position = 'hero' THEN 1 ELSE 0 END DESC,
    CASE WHEN c2.is_primary = 1 THEN 1 ELSE 0 END DESC,
    c2.sort_order ASC,
    c2.id ASC
  LIMIT 1
)
WHERE (catalog_media.media_id IS NULL OR catalog_media.media_id = '')
  AND EXISTS (
    SELECT 1
    FROM catalog_media AS c2
    WHERE c2.catalog_id = catalog_media.catalog_id
      AND c2.media_id IS NOT NULL
      AND c2.media_id <> ''
  );
