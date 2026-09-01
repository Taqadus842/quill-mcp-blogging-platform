import Database from "better-sqlite3";

import fs from "fs";

import path from "path";

const databasePath =
  process.env.DATABASE_PATH ||
  "./data/quill.db";

const absolutePath =
  path.resolve(databasePath);

const dataDirectory =
  path.dirname(absolutePath);

if (
  !fs.existsSync(dataDirectory)
) {
  fs.mkdirSync(
    dataDirectory,
    { recursive: true }
  );
}

const db =
  new Database(absolutePath);

db.pragma(
  "foreign_keys = ON"
);

// Audit logs table
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id INTEGER,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
      REFERENCES users(id)
  );
`);

export default db;