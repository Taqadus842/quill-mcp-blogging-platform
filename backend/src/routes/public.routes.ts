import { Router } from "express";

import {
  getPublicPost,
} from "../services/post.service.js";

const router = Router();

router.get(
  "/posts/:slug",
  (req, res) => {
    const post =
      getPublicPost(
        req.params.slug
      );

    if (!post) {
      return res.status(404).json({
        error:
          "Published post not found",
      });
    }

    res.json(post);
  }
);

export default router;