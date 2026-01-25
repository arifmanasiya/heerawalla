SELECT DISTINCT categories
FROM catalog_items
WHERE categories IS NOT NULL AND categories <> ''
ORDER BY categories;
