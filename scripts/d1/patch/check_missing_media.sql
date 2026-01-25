SELECT COUNT(*) AS missing_media_id
FROM catalog_media
WHERE media_id IS NULL OR media_id = '';
