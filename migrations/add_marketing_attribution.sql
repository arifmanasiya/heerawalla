-- Add marketing attribution columns to consultations table
-- Creates the consultations table if it does not already exist.

CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  request_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  message TEXT,
  how_heard_about_us TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer_url TEXT,
  landing_page_url TEXT,
  consultation_status TEXT DEFAULT 'scheduled',
  consultation_outcome TEXT,
  converted_to_quote_id TEXT,
  converted_to_order_id TEXT,
  admin_notes TEXT,
  consultation_date TEXT,
  consultation_time TEXT,
  contact_preference TEXT,
  phone_preferred INTEGER
);

CREATE INDEX IF NOT EXISTS idx_consultations_utm_source ON consultations(utm_source);
CREATE INDEX IF NOT EXISTS idx_consultations_utm_campaign ON consultations(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(consultation_status);
