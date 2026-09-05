import { Router } from "express";

import {
  getPostAnalytics,
} from "../services/analytics.service.js";

import {
  AuthenticatedRequest,
  requireAuth,
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/posts/:postId",
  requireAuth,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    const postId =
      Number(req.params.postId);

    if (
      !Number.isInteger(postId) ||
      postId <= 0
    ) {
      return res.status(400).json({
        error: "Invalid post ID",
      });
    }

    if (req.userId === undefined) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    try {
      const analytics =
        getPostAnalytics(
          req.userId,
          postId
        );

      return res.json({
        postId,
        analytics,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Failed to get analytics",
      });
    }
  }
);

export default router;