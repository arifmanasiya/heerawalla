PRAGMA foreign_keys = OFF;
DELETE FROM catalog_items;
DELETE FROM catalog_media;
DELETE FROM media_library;
DELETE FROM site_config;
DELETE FROM price_chart;
DELETE FROM cost_chart;
DELETE FROM diamond_price_chart;
DELETE FROM diamond_clarity_groups;
DELETE FROM orders;
DELETE FROM order_details;
DELETE FROM quotes;
DELETE FROM contacts;
DELETE FROM unified_contacts;

PRAGMA foreign_keys = ON;
