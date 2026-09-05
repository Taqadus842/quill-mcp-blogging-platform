import bcrypt from "bcrypt";

import db from "../database/database.js";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export async function createUser(
  email: string,
  password: string
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const existing = db
    .prepare(
      "SELECT id FROM users WHERE email = ?"
    )
    .get(normalizedEmail);

  if (existing) {
    throw new Error(
      "Email is already registered"
    );
  }

  const passwordHash =
    await bcrypt.hash(password, 12);

  const result = db
    .prepare(
      `
      INSERT INTO users
      (email, password_hash)
      VALUES (?, ?)
      `
    )
    .run(
      normalizedEmail,
      passwordHash
    );

  return {
    id: Number(result.lastInsertRowid),
    email: normalizedEmail,
  };
}

export async function verifyUser(
  email: string,
  password: string
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const user = db
    .prepare(
      `
      SELECT *
      FROM users
      WHERE email = ?
      `
    )
    .get(normalizedEmail) as
    | User
    | undefined;

  if (!user) {
    return null;
  }

  const valid =
    await bcrypt.compare(
      password,
      user.password_hash
    );

  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}