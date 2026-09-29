CREATE TABLE leads_v2 (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK(length(email) BETWEEN 3 AND 254),
  phone TEXT NOT NULL CHECK(length(phone) = 14 AND substr(phone, 1, 4) = '+234' AND substr(phone, 5, 1) IN ('7', '8', '9') AND substr(phone, 5) NOT GLOB '*[^0-9]*'),
  city TEXT NOT NULL CHECK(city IN ('Kano', 'Katsina')),
  role TEXT NOT NULL CHECK(role IN ('customer', 'vendor', 'rider', 'affiliate')),
  consent INTEGER NOT NULL CHECK(consent = 1),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(email, role, city)
);

INSERT INTO leads_v2 SELECT * FROM leads;
DROP TABLE leads;
ALTER TABLE leads_v2 RENAME TO leads;
