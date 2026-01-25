SELECT id, catalog_id, media_id, position, is_primary, sort_order
FROM catalog_media
WHERE catalog_id = 'hws-005'
ORDER BY id;
