import db from "../database/database.js";

export function recordEvent(
  userId: number | null,
  postId: number | null,
  eventType: string,
  metadata?: unknown
) {
  db.prepare(
    `
    INSERT INTO analytics_events
    (
      user_id,
      post_id,
      event_type,
      metadata
    )
    VALUES (?, ?, ?, ?)
    `
  ).run(
    userId,
    postId,
    eventType,
    metadata !== undefined
      ? JSON.stringify(metadata)
      : null
  );
}

export function getPostAnalytics(
  userId: number,
  postId: number
) {
  return db
    .prepare(
      `
      SELECT
        event_type,
        COUNT(*) AS count
      FROM analytics_events
      WHERE user_id = ?
      AND post_id = ?
      GROUP BY event_type
      ORDER BY event_type
      `
    )
    .all(
      userId,
      postId
    );
}