import db from "../database/database.js";

export type PostStatus =
  | "draft"
  | "published"
  | "scheduled";

export interface CreatePostInput {
  title: string;
  slug: string;
  content?: string;
  status?: PostStatus;
  scheduledAt?: string;
  seoTitle?: string;
  seoDescription?: string;
}

function validatePostInput(
  input: CreatePostInput
) {
  if (
    typeof input.title !== "string" ||
    !input.title.trim()
  ) {
    throw new Error("Title is required");
  }

  if (
    typeof input.slug !== "string" ||
    !input.slug.trim()
  ) {
    throw new Error("Slug is required");
  }

  if (
    input.status &&
    ![
      "draft",
      "published",
      "scheduled",
    ].includes(input.status)
  ) {
    throw new Error("Invalid post status");
  }

  if (
    input.status === "scheduled" &&
    !input.scheduledAt
  ) {
    throw new Error("scheduledAt is required");
  }
}

export function createPost(
  userId: number,
  input: CreatePostInput
) {
  validatePostInput(input);

  const status =
    input.status || "draft";

  const publishedAt =
    status === "published"
      ? new Date().toISOString()
      : null;

  const result = db
    .prepare(
      `
      INSERT INTO posts
      (
        user_id,
        title,
        slug,
        content,
        status,
        scheduled_at,
        published_at,
        seo_title,
        seo_description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      userId,
      input.title.trim(),
      input.slug.trim(),
      input.content || "",
      status,
      input.scheduledAt || null,
      publishedAt,
      input.seoTitle || null,
      input.seoDescription || null
    );

  return getPost(
    userId,
    Number(result.lastInsertRowid)
  );
}

export function getPost(
  userId: number,
  postId: number
) {
  return db
    .prepare(
      `
      SELECT *
      FROM posts
      WHERE id = ?
      AND user_id = ?
      `
    )
    .get(
      postId,
      userId
    );
}

export function listPosts(
  userId: number
) {
  return db
    .prepare(
      `
      SELECT *
      FROM posts
      WHERE user_id = ?
      ORDER BY created_at DESC
      `
    )
    .all(userId);
}

export function updatePost(
  userId: number,
  postId: number,
  input: Partial<CreatePostInput>
) {
  const existing =
    getPost(
      userId,
      postId
    ) as
    | {
        title: string;
        slug: string;
        content: string;
        status: PostStatus;
        scheduled_at: string | null;
        published_at: string | null;
        seo_title: string | null;
        seo_description: string | null;
      }
    | undefined;

  if (!existing) {
    throw new Error("Post not found");
  }

  if (
    input.title !== undefined &&
    (
      typeof input.title !== "string" ||
      !input.title.trim()
    )
  ) {
    throw new Error("Title cannot be empty");
  }

  if (
    input.slug !== undefined &&
    (
      typeof input.slug !== "string" ||
      !input.slug.trim()
    )
  ) {
    throw new Error("Slug cannot be empty");
  }

  const status =
    input.status ??
    existing.status;

  if (
    ![
      "draft",
      "published",
      "scheduled",
    ].includes(status)
  ) {
    throw new Error("Invalid post status");
  }

  const scheduledAt =
    input.scheduledAt ??
    existing.scheduled_at;

  if (
    status === "scheduled" &&
    !scheduledAt
  ) {
    throw new Error(
      "scheduledAt is required"
    );
  }

  let publishedAt:
    | string
    | null;

  if (status === "published") {
    publishedAt =
      existing.status === "published" &&
      existing.published_at
        ? existing.published_at
        : new Date().toISOString();
  } else {
    publishedAt = null;
  }

  db.prepare(
    `
    UPDATE posts
    SET
      title = ?,
      slug = ?,
      content = ?,
      status = ?,
      scheduled_at = ?,
      published_at = ?,
      seo_title = ?,
      seo_description = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    AND user_id = ?
    `
  ).run(
    input.title?.trim() ??
      existing.title,

    input.slug?.trim() ??
      existing.slug,

    input.content ??
      existing.content,

    status,

    status === "scheduled"
      ? scheduledAt
      : null,

    publishedAt,

    input.seoTitle ??
      existing.seo_title,

    input.seoDescription ??
      existing.seo_description,

    postId,
    userId
  );

  return getPost(
    userId,
    postId
  );
}

export function deletePost(
  userId: number,
  postId: number
) {
  const post = getPost(
    userId,
    postId
  );

  if (!post) {
    throw new Error(
      "Post not found"
    );
  }

  const transaction = db.transaction(
    () => {
      db.prepare(
        `
        DELETE FROM analytics_events
        WHERE post_id = ?
        AND user_id = ?
        `
      ).run(
        postId,
        userId
      );

      const result = db
        .prepare(
          `
          DELETE FROM posts
          WHERE id = ?
          AND user_id = ?
          `
        )
        .run(
          postId,
          userId
        );

      if (result.changes === 0) {
        throw new Error(
          "Post not found"
        );
      }
    }
  );

  transaction();
}

export function publishPost(
  userId: number,
  postId: number
) {
  const result = db
    .prepare(
      `
      UPDATE posts
      SET
        status = 'published',
        published_at = CURRENT_TIMESTAMP,
        scheduled_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      AND user_id = ?
      `
    )
    .run(
      postId,
      userId
    );

  if (result.changes === 0) {
    throw new Error(
      "Post not found"
    );
  }

  return getPost(
    userId,
    postId
  );
}

export function unpublishPost(
  userId: number,
  postId: number
) {
  const result = db
    .prepare(
      `
      UPDATE posts
      SET
        status = 'draft',
        published_at = NULL,
        scheduled_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      AND user_id = ?
      `
    )
    .run(
      postId,
      userId
    );

  if (result.changes === 0) {
    throw new Error(
      "Post not found"
    );
  }

  return getPost(
    userId,
    postId
  );
}

export function schedulePost(
  userId: number,
  postId: number,
  scheduledAt: string
) {
  if (!scheduledAt) {
    throw new Error(
      "scheduledAt is required"
    );
  }

  const scheduledDate =
    new Date(scheduledAt);

  if (
    Number.isNaN(
      scheduledDate.getTime()
    )
  ) {
    throw new Error(
      "Invalid scheduledAt date"
    );
  }

  const result = db
    .prepare(
      `
      UPDATE posts
      SET
        status = 'scheduled',
        scheduled_at = ?,
        published_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      AND user_id = ?
      `
    )
    .run(
      scheduledAt,
      postId,
      userId
    );

  if (result.changes === 0) {
    throw new Error(
      "Post not found"
    );
  }

  return getPost(
    userId,
    postId
  );
}

export function getPublicPost(
  slug: string
) {
  return db
    .prepare(
      `
      SELECT
        id,
        title,
        slug,
        content,
        published_at,
        seo_title,
        seo_description
      FROM posts
      WHERE slug = ?
      AND status = 'published'
      LIMIT 1
      `
    )
    .get(slug);
}