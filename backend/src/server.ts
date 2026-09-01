import "dotenv/config";

import express from "express";

import { env } from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import apiKeyRoutes from "./routes/apiKey.routes.js";
import postRoutes from "./routes/post.routes.js";
import publicRoutes from "./routes/public.routes.js";
import healthRoutes from "./routes/health.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

import { rateLimit } from "./middleware/rateLimit.js";

const app = express();

app.use(express.json());

app.use(rateLimit);

app.get("/", (_req, res) => {
  res.json({
    message: "Quill Backend API is running",
    health: "/health"
  });
});

app.use(healthRoutes);

app.use(
  "/auth",
  authRoutes
);

app.use(
  "/api-keys",
  apiKeyRoutes
);

app.use(
  "/posts",
  postRoutes
);

app.use(
  "/public",
  publicRoutes
);

app.use(
  "/analytics", 
  analyticsRoutes
);

app.use(
  (
    _req,
    res
  ) => {
    res.status(404).json({
      error:
        "Route not found",
    });
  }
);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(error);

    res.status(500).json({
      error:
        "Internal server error",
    });
  }
);

app.listen(
  env.port,
  () => {
    console.log(
      `Quill backend running on http://localhost:${env.port}`
    );
  }
);