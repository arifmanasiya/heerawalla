PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS order_details_new (
  request_id TEXT PRIMARY KEY REFERENCES orders(request_id) ON DELETE CASCADE,
  created_at TEXT,
  status TEXT,
  payment_url TEXT,
  shipping_method TEXT,
  shipping_carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipping_status TEXT,
  shipping_notes TEXT,
  shipped_at TEXT,
  delivery_eta TEXT,
  delivered_at TEXT,
  certificates TEXT,
  care_details TEXT,
  warranty_details TEXT,
  service_details TEXT,
  updated_at TEXT,
  updated_by TEXT,
  last_shipping_check_at TEXT
);

INSERT INTO order_details_new (
  request_id,
  created_at,
  status,
  payment_url,
  shipping_method,
  shipping_carrier,
  tracking_number,
  tracking_url,
  shipping_status,
  shipping_notes,
  shipped_at,
  delivery_eta,
  delivered_at,
  certificates,
  care_details,
  warranty_details,
  service_details,
  updated_at,
  updated_by,
  last_shipping_check_at
)
SELECT
  request_id,
  created_at,
  status,
  payment_url,
  shipping_method,
  shipping_carrier,
  tracking_number,
  tracking_url,
  shipping_status,
  shipping_notes,
  shipped_at,
  delivery_eta,
  delivered_at,
  certificates,
  care_details,
  warranty_details,
  service_details,
  updated_at,
  updated_by,
  last_shipping_check_at
FROM order_details;

DROP TABLE order_details;
ALTER TABLE order_details_new RENAME TO order_details;

CREATE TRIGGER IF NOT EXISTS trg_catalog_items_delete_media
AFTER DELETE ON catalog_items
BEGIN
  DELETE FROM catalog_media
  WHERE catalog_type = OLD.type AND catalog_slug = OLD.slug;
END;
