import { Router } from "express";

import {
  AuthenticatedRequest,
  requireAuth,
} from "../middleware/auth.js";

import {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  rotateApiKey,
} from "../services/apiKey.service.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    res.json(
      listApiKeys(
        req.userId!
      )
    );
  }
);

router.post(
  "/",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    const { name } =
      req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        error:
          "API key name is required",
      });
    }

    const apiKey =
      generateApiKey(
        req.userId!,
        name.trim()
      );

    res.status(201).json(
      apiKey
    );
  }
);

router.post(
  "/:id/rotate",
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const newKey =
        rotateApiKey(
          req.userId!,
          Number(req.params.id)
        );

      res.json(newKey);
    } catch (error) {
      res.status(404).json({
        error:
          error instanceof Error
            ? error.message
            : "API key not found",
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
    const success =
      revokeApiKey(
        req.userId!,
        Number(req.params.id)
      );

    if (!success) {
      return res.status(404).json({
        error:
          "API key not found",
      });
    }

    res.json({
      message:
        "API key revoked",
    });
  }
);

export default router;