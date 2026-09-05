import crypto from "crypto";

import db from "../database/database.js";

import {
  recordAudit,
} from "./audit.service.js";

function hashKey(key: string) {
  return crypto
    .createHash("sha256")
    .update(key)
    .digest("hex");
}

export function generateApiKey(
  userId: number,
  name: string
) {
  const random =
    crypto
      .randomBytes(32)
      .toString("hex");

  const key =
    `qll_${random}`;

  const keyHash =
    hashKey(key);

  const keyPrefix =
    key.substring(0, 12);

  const result = db
    .prepare(
      `
      INSERT INTO api_keys
      (
        user_id,
        name,
        key_hash,
        key_prefix
      )
      VALUES (?, ?, ?, ?)
      `
    )
    .run(
      userId,
      name,
      keyHash,
      keyPrefix
    );

  const keyId =
    Number(
      result.lastInsertRowid
    );

  recordAudit(
    userId,
    "api_key_created",
    "api_key",
    keyId,
    {
      name,
      keyPrefix,
    }
  );

  return {
    id: keyId,
    name,
    key,
    keyPrefix,
  };
}

export function listApiKeys(
  userId: number
) {
  return db
    .prepare(
      `
      SELECT
        id,
        name,
        key_prefix,
        created_at,
        last_used_at,
        revoked_at
      FROM api_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
      `
    )
    .all(userId);
}

export function verifyApiKey(
  key: string
) {
  const keyHash =
    hashKey(key);

  const apiKey = db
    .prepare(
      `
      SELECT *
      FROM api_keys
      WHERE key_hash = ?
      AND revoked_at IS NULL
      `
    )
    .get(keyHash) as
    | {
        id: number;
        user_id: number;
        name: string;
        key_hash: string;
        key_prefix: string;
        created_at: string;
        last_used_at: string | null;
        revoked_at: string | null;
      }
    | undefined;

  if (apiKey) {
    db.prepare(
      `
      UPDATE api_keys
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
    ).run(apiKey.id);
  }

  return apiKey;
}

export function revokeApiKey(
  userId: number,
  keyId: number
) {
  const result = db
    .prepare(
      `
      UPDATE api_keys
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = ?
      AND user_id = ?
      AND revoked_at IS NULL
      `
    )
    .run(
      keyId,
      userId
    );

  if (result.changes > 0) {
    recordAudit(
      userId,
      "api_key_revoked",
      "api_key",
      keyId
    );
  }

  return result.changes > 0;
}

export function rotateApiKey(
  userId: number,
  keyId: number
) {
  const oldKey = db
    .prepare(
      `
      SELECT name
      FROM api_keys
      WHERE id = ?
      AND user_id = ?
      AND revoked_at IS NULL
      `
    )
    .get(
      keyId,
      userId
    ) as
    | {
        name: string;
      }
    | undefined;

  if (!oldKey) {
    throw new Error(
      "API key not found"
    );
  }

  revokeApiKey(
    userId,
    keyId
  );

  const newKey =
    generateApiKey(
      userId,
      `${oldKey.name} (rotated)`
    );

  recordAudit(
    userId,
    "api_key_rotated",
    "api_key",
    newKey.id,
    {
      oldKeyId: keyId,
      newKeyId: newKey.id,
    }
  );

  return newKey;
}