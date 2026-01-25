DELETE FROM catalog_media WHERE catalog_id = 'hws-005';

INSERT INTO catalog_media (catalog_id, media_id, position, is_primary, sort_order)
SELECT
  'hws-005' AS catalog_id,
  media_id,
  CASE
    WHEN lower(COALESCE(label, media_id)) LIKE 'hero%' OR lower(media_id) LIKE '%img-hero%' THEN 'hero'
    WHEN lower(COALESCE(label, media_id)) LIKE 'pendant%' THEN 'pendant'
    WHEN lower(COALESCE(label, media_id)) LIKE 'bracelet%' THEN 'bracelet'
    WHEN lower(COALESCE(label, media_id)) LIKE 'earring%' THEN 'earring'
    WHEN lower(COALESCE(label, media_id)) LIKE 'ring%' THEN 'ring'
    ELSE ''
  END AS position,
  CASE
    WHEN lower(COALESCE(label, media_id)) LIKE 'hero%' OR lower(media_id) LIKE '%img-hero%' THEN 1
    ELSE 0
  END AS is_primary,
  CASE
    WHEN lower(COALESCE(label, media_id)) LIKE 'hero%' OR lower(media_id) LIKE '%img-hero%' THEN 0
    WHEN lower(COALESCE(label, media_id)) LIKE 'pendant%' THEN 1
    WHEN lower(COALESCE(label, media_id)) LIKE 'bracelet%' THEN 2
    WHEN lower(COALESCE(label, media_id)) LIKE 'earring%' THEN 3
    WHEN lower(COALESCE(label, media_id)) LIKE 'ring%' THEN 4
    ELSE 5
  END AS sort_order
FROM media_library
WHERE media_id LIKE '%hws-005%';
