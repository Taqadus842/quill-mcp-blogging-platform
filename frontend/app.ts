import express from "express";
import cookieSession from "cookie-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mcpRouter } from "../mcp/route.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { publicRouter } from "./routes/publicSite.js";
import { attachUser } from "./session.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function buildApp() {
  const app = express();
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.disable("x-powered-by");
  app.use("/mcp", express.json());
  app.use(mcpRouter);

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  app.use(express.static(path.join(__dirname, "public")));

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET must be set (see .env.example).");
  }
  app.use(
    cookieSession({
      name: "quill_session",
      secret: sessionSecret,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(attachUser);

  app.get("/", (req, res) => {
    if ((res.locals as any).user) return res.redirect("/dashboard");
    res.render("home", { title: undefined });
  });

  app.use(authRouter);
  app.use("/dashboard", dashboardRouter);
  app.use(publicRouter);

  app.use((_req, res) => {
    res.status(404).render("404", { title: "Not found" });
  });

  return app;
}