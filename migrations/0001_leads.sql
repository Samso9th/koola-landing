CREATE TABLE leads (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK(length(email) BETWEEN 3 AND 254),
  phone TEXT NOT NULL CHECK(length(phone) = 14 AND phone GLOB '+234[789][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
  city TEXT NOT NULL CHECK(city IN ('Kano', 'Katsina')),
  role TEXT NOT NULL CHECK(role IN ('customer', 'vendor', 'rider', 'affiliate')),
  consent INTEGER NOT NULL CHECK(consent = 1),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(email, role, city)
);

CREATE TABLE lead_rate_limits (
  ip_hash TEXT NOT NULL CHECK(length(ip_hash) = 64),
  bucket INTEGER NOT NULL,
  count INTEGER NOT NULL CHECK(count BETWEEN 1 AND 30),
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(ip_hash, bucket)
) WITHOUT ROWID;
CREATE INDEX lead_rate_limits_expiry ON lead_rate_limits(expires_at);
