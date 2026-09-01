import db from "../database/database.js";

export function recordAudit(
  userId: number | null,
  action: string,
  resourceType?: string,
  resourceId?: number | null,
  metadata?: unknown
) {
  db.prepare(
    `
    INSERT INTO audit_logs
    (
      user_id,
      action,
      resource_type,
      resource_id,
      metadata
    )
    VALUES (?, ?, ?, ?, ?)
    `
  ).run(
    userId,
    action,
    resourceType ?? null,
    resourceId ?? null,
    metadata !== undefined
      ? JSON.stringify(metadata)
      : null
  );
}