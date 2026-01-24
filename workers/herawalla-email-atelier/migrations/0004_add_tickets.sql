PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tickets (
  request_id TEXT PRIMARY KEY,
  created_at TEXT,
  status TEXT,
  subject TEXT,
  summary TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  page_url TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_tickets_status_created
  ON tickets (status, created_at);

CREATE INDEX IF NOT EXISTS idx_tickets_email
  ON tickets (email);

CREATE TABLE IF NOT EXISTS ticket_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL REFERENCES tickets(request_id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  kind TEXT,
  note TEXT,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_ticket_details_request
  ON ticket_details (request_id, created_at);

INSERT OR IGNORE INTO tickets (
  created_at,
  request_id,
  status,
  subject,
  summary,
  name,
  email,
  phone,
  source,
  page_url
)
SELECT
  created_at,
  request_id,
  COALESCE(NULLIF(status, ''), 'NEW'),
  interests,
  notes,
  name,
  email,
  phone,
  source,
  page_url
FROM contacts
WHERE request_id IS NOT NULL AND request_id <> '';

INSERT INTO ticket_details (request_id, created_at, kind, note)
SELECT
  request_id,
  created_at,
  'note',
  notes
FROM contacts
WHERE request_id IS NOT NULL
  AND request_id <> ''
  AND notes IS NOT NULL
  AND notes <> '';
