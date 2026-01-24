INSERT INTO d1_migrations (name, applied_at)
SELECT '0009_drop_catalog_hero_image.sql', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = '0009_drop_catalog_hero_image.sql');

INSERT INTO d1_migrations (name, applied_at)
SELECT '0017_replace_catalog_media_schema.sql', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = '0017_replace_catalog_media_schema.sql');

INSERT INTO d1_migrations (name, applied_at)
SELECT '0018_make_catalog_media_catalog_id_not_null.sql', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = '0018_make_catalog_media_catalog_id_not_null.sql');
