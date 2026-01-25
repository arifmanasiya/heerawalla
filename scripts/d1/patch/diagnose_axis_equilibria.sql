SELECT id, slug
FROM catalog_items
WHERE slug = 'axis-equilibria';

SELECT media_id, url, label
FROM media_library
WHERE media_id LIKE '%hws-005%' OR url LIKE '%hws-005%'
ORDER BY media_id
LIMIT 20;
