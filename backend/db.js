const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(process.env.DB_PATH || path.join(__dirname, 'attendance.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    phone           TEXT UNIQUE NOT NULL,
    password        TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'employee',
    face_descriptor TEXT,
    face_photo      TEXT,
    is_verified     INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS otps (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    otp        TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    date            TEXT NOT NULL,
    punch_in        TEXT,
    punch_out       TEXT,
    punch_in_photo  TEXT,
    punch_out_photo TEXT,
    lat             REAL,
    lng             REAL,
    status          TEXT NOT NULL DEFAULT 'present',
    UNIQUE(user_id, date),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Performance indexes for the most frequent query patterns
  CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_phone        ON users(phone);
  CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
  CREATE INDEX IF NOT EXISTS idx_otps_user_active   ON otps(user_id, used, expires_at);
  CREATE INDEX IF NOT EXISTS idx_attendance_user    ON attendance(user_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_date    ON attendance(date);
  CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
`);

module.exports = db;
