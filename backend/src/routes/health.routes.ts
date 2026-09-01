import { Router } from "express";

import db from "../database/database.js";

const router = Router();

router.get(
  "/health",
  (_req, res) => {
    try {
      db.prepare(
        "SELECT 1"
      ).get();

      res.json({
        status: "ok",
        service:
          "quill-backend",
        database:
          "connected",
      });
    } catch {
      res.status(503).json({
        status: "error",
        service:
          "quill-backend",
        database:
          "disconnected",
      });
    }
  }
);

export default router;