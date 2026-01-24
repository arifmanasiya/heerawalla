PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('product', 'inspiration')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_desc TEXT,
  long_desc TEXT,
  hero_image TEXT,
  collection TEXT,
  categories TEXT,
  gender TEXT,
  styles TEXT,
  motifs TEXT,
  metals TEXT,
  metal_options TEXT,
  stone_types TEXT,
  stone_type_options TEXT,
  stone_weight TEXT,
  stone_weight_range TEXT,
  metal_weight TEXT,
  metal_weight_range TEXT,
  palette TEXT,
  takeaways TEXT,
  translation_notes TEXT,
  design_code TEXT,
  cut TEXT,
  cut_range TEXT,
  clarity TEXT,
  clarity_range TEXT,
  color TEXT,
  color_range TEXT,
  carat TEXT,
  price_usd_natural REAL,
  estimated_price_usd_vvs1_vvs2_18k REAL,
  lab_discount_pct REAL,
  metal_platinum_premium REAL,
  metal_14k_discount_pct REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_type_active
  ON catalog_items (type, is_active, is_featured);

CREATE TABLE IF NOT EXISTS media_library (
  media_id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  media_type TEXT,
  label TEXT,
  alt TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS catalog_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_type TEXT NOT NULL CHECK (catalog_type IN ('product', 'inspiration')),
  catalog_slug TEXT NOT NULL,
  media_id TEXT NOT NULL,
  position TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_catalog_media_slug
  ON catalog_media (catalog_type, catalog_slug);

CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS price_chart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metal TEXT NOT NULL,
  adjustment_type TEXT NOT NULL,
  adjustment_value REAL NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS cost_chart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value REAL NOT NULL,
  unit TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS diamond_price_chart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clarity TEXT NOT NULL,
  color TEXT NOT NULL,
  weight_min REAL NOT NULL,
  weight_max REAL NOT NULL,
  price_per_ct REAL NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_diamond_price_chart_lookup
  ON diamond_price_chart (clarity, color, weight_min, weight_max);

CREATE TABLE IF NOT EXISTS diamond_clarity_groups (
  group_key TEXT NOT NULL,
  clarity TEXT NOT NULL,
  PRIMARY KEY (group_key, clarity)
);

INSERT OR IGNORE INTO diamond_clarity_groups (group_key, clarity) VALUES
  ('IF', 'IF'),
  ('IF', 'IF-VVS'),
  ('VVS', 'IF-VVS'),
  ('VVS', 'VVS1'),
  ('VVS', 'VVS2'),
  ('VS', 'VS1'),
  ('VS', 'VS2'),
  ('SI', 'SI1'),
  ('SI', 'SI2'),
  ('SI', 'SI3'),
  ('I', 'I1'),
  ('I', 'I2'),
  ('I', 'I3');

CREATE TABLE IF NOT EXISTS orders (
  request_id TEXT PRIMARY KEY,
  created_at TEXT,
  status TEXT,
  status_updated_at TEXT,
  notes TEXT,
  last_error TEXT,
  price TEXT,
  timeline TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  product_name TEXT,
  product_url TEXT,
  design_code TEXT,
  metal TEXT,
  stone TEXT,
  stone_weight TEXT,
  size TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  origin TEXT,
  ip TEXT,
  user_agent TEXT,
  metal_weight TEXT,
  metal_weight_adjustment TEXT,
  timeline_adjustment_weeks TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (email);

CREATE TABLE IF NOT EXISTS order_details (
  request_id TEXT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS quotes (
  request_id TEXT PRIMARY KEY,
  created_at TEXT,
  status TEXT,
  status_updated_at TEXT,
  notes TEXT,
  last_error TEXT,
  price TEXT,
  timeline TEXT,
  timeline_adjustment_weeks TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  product_name TEXT,
  product_url TEXT,
  design_code TEXT,
  metal TEXT,
  metal_weight TEXT,
  stone TEXT,
  stone_weight TEXT,
  diamond_breakdown TEXT,
  size TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  origin TEXT,
  ip TEXT,
  user_agent TEXT,
  quote_metal_options TEXT,
  quote_option_1_clarity TEXT,
  quote_option_1_color TEXT,
  quote_option_1_price_18k TEXT,
  quote_option_2_clarity TEXT,
  quote_option_2_color TEXT,
  quote_option_2_price_18k TEXT,
  quote_option_3_clarity TEXT,
  quote_option_3_color TEXT,
  quote_option_3_price_18k TEXT,
  quote_discount_type TEXT,
  quote_discount_percent TEXT,
  quote_token TEXT,
  quote_expires_at TEXT,
  quote_sent_at TEXT,
  quote_selected_metal TEXT,
  quote_selected_option TEXT,
  quote_selected_price TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes (status, created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes (email);

CREATE TABLE IF NOT EXISTS contacts (
  email TEXT PRIMARY KEY,
  created_at TEXT,
  name TEXT,
  phone TEXT,
  source TEXT,
  request_id TEXT,
  contact_preference TEXT,
  interests TEXT,
  page_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  subscription_status TEXT,
  status TEXT,
  status_updated_at TEXT,
  notes TEXT,
  last_error TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status, created_at);

CREATE TABLE IF NOT EXISTS unified_contacts (
  email TEXT PRIMARY KEY,
  created_at TEXT,
  name TEXT,
  phone TEXT,
  type TEXT,
  subscribed TEXT,
  sources TEXT,
  first_seen_at TEXT,
  last_seen_at TEXT,
  last_source TEXT,
  unsubscribed_at TEXT,
  unsubscribed_reason TEXT,
  updated_at TEXT
);
