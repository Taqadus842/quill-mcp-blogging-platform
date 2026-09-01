import { Router } from "express";

import {
  recordEvent,
} from "../services/analytics.service.js";

import {
  AuthenticatedRequest,
  requireAuth,
} from "../middleware/auth.js";

import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  publishPost,
  schedulePost,
  unpublishPost,
  updatePost,
} from "../services/post.service.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const posts = listPosts(
        req.userId!
      );

      return res.json(posts);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Failed to list posts",
      });
    }
  }
);

router.get(
  "/:id",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    const postId =
      Number(req.params.id);

    if (
      !Number.isInteger(postId) ||
      postId <= 0
    ) {
      return res.status(400).json({
        error: "Invalid post ID",
      });
    }

    const post = getPost(
      req.userId!,
      postId
    );

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    return res.json(post);
  }
);

router.post(
  "/",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const post =
        createPost(
          req.userId!,
          req.body
        );

      if (!post) {
        return res.status(500).json({
          error: "Failed to create post",
        });
      }

      recordEvent(
        req.userId!,
        Number(
          (post as { id: number }).id
        ),
        "post_created"
      );

      return res
        .status(201)
        .json(post);
    } catch (error) {
      console.error(error);

      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Could not create post",
      });
    }
  }
);

router.put(
  "/:id",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const postId =
        Number(req.params.id);

      if (
        !Number.isInteger(postId) ||
        postId <= 0
      ) {
        return res.status(400).json({
          error: "Invalid post ID",
        });
      }

      const post =
        updatePost(
          req.userId!,
          postId,
          req.body
        );

      recordEvent(
        req.userId!,
        postId,
        "post_updated"
      );

      return res.json(post);
    } catch (error) {
      console.error(error);

      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Could not update post",
      });
    }
  }
);

router.delete(
  "/:id",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const postId =
        Number(req.params.id);

      if (
        !Number.isInteger(postId) ||
        postId <= 0
      ) {
        return res.status(400).json({
          error: "Invalid post ID",
        });
      }

      deletePost(
        req.userId!,
        postId
      );

      return res.json({
        message: "Post deleted",
      });
    } catch (error) {
      console.error(error);

      return res.status(404).json({
        error:
          error instanceof Error
            ? error.message
            : "Post not found",
      });
    }
  }
);

router.post(
  "/:id/publish",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const postId =
        Number(req.params.id);

      if (
        !Number.isInteger(postId) ||
        postId <= 0
      ) {
        return res.status(400).json({
          error: "Invalid post ID",
        });
      }

      const post =
        publishPost(
          req.userId!,
          postId
        );

      recordEvent(
        req.userId!,
        postId,
        "post_published"
      );

      return res.json(post);
    } catch (error) {
      console.error(error);

      return res.status(404).json({
        error:
          error instanceof Error
            ? error.message
            : "Post not found",
      });
    }
  }
);

router.post(
  "/:id/unpublish",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const postId =
        Number(req.params.id);

      if (
        !Number.isInteger(postId) ||
        postId <= 0
      ) {
        return res.status(400).json({
          error: "Invalid post ID",
        });
      }

      const post =
        unpublishPost(
          req.userId!,
          postId
        );

      recordEvent(
        req.userId!,
        postId,
        "post_unpublished"
      );

      return res.json(post);
    } catch (error) {
      console.error(error);

      return res.status(404).json({
        error:
          error instanceof Error
            ? error.message
            : "Post not found",
      });
    }
  }
);

router.post(
  "/:id/schedule",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const postId =
        Number(req.params.id);

      if (
        !Number.isInteger(postId) ||
        postId <= 0
      ) {
        return res.status(400).json({
          error: "Invalid post ID",
        });
      }

      const {
        scheduledAt,
      } = req.body;

      if (
        typeof scheduledAt !==
          "string" ||
        !scheduledAt
      ) {
        return res.status(400).json({
          error:
            "scheduledAt is required",
        });
      }

      const post =
        schedulePost(
          req.userId!,
          postId,
          scheduledAt
        );

      recordEvent(
        req.userId!,
        postId,
        "post_scheduled",
        {
          scheduledAt,
        }
      );

      return res.json(post);
    } catch (error) {
      console.error(error);

      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Could not schedule post",
      });
    }
  }
);

export default router;