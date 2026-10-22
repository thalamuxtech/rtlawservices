-- Records keep the shape they had in Firestore: one JSON document per row,
-- grouped by collection. Timestamps inside the JSON are stored as
-- {"__ts": "<ISO 8601>"} so the back office can tell them from plain text.
CREATE TABLE docs (
  col TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (col, id)
);

-- One row per 30-minute block an attorney is booked for. The primary key
-- makes a second booking of the same block fail, which prevents double booking.
CREATE TABLE slots (
  id TEXT PRIMARY KEY,
  attorney TEXT NOT NULL,
  day TEXT NOT NULL,
  start TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX slots_by_day ON slots (attorney, day);
CREATE INDEX slots_by_booking ON slots (booking_id);

-- Staff sign-in. pw_hash is empty for accounts moved from Firebase until
-- their first sign-in, when the old password is checked once with Firebase.
CREATE TABLE users (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pw_hash TEXT,
  pw_salt TEXT,
  pw_iter INTEGER,
  created_at TEXT NOT NULL
);

-- Only a SHA-256 digest of each session and reset token is stored.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_by_uid ON sessions (uid);

CREATE TABLE resets (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Counters for sign-in attempts and public form submissions.
CREATE TABLE throttle (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
