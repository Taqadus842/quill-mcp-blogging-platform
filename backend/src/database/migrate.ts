import fs from "fs";
import path from "path";

import db from "./database.js";

const migrationsDirectory = path.resolve(
  process.cwd(),
  "src/database/migrations"
);

db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const migrationFiles = fs
  .readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of migrationFiles) {
  const existing = db
    .prepare(
      "SELECT id FROM migrations WHERE name = ?"
    )
    .get(file);

  if (existing) {
    console.log(`Skipping migration: ${file}`);
    continue;
  }

  const filePath = path.join(
    migrationsDirectory,
    file
  );

  const sql = fs.readFileSync(
    filePath,
    "utf-8"
  );

  const transaction = db.transaction(() => {
    db.exec(sql);

    db.prepare(
      "INSERT INTO migrations (name) VALUES (?)"
    ).run(file);
  });

  transaction();

  console.log(
    `Migration executed: ${file}`
  );
}

console.log(
  "Database migrations completed."
);