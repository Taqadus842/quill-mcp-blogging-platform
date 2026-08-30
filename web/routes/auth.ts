import { Router } from "express";
import { z } from "zod";
import {
  createUser,
  getUserByEmail,
  getUserByUsername,
  verifyUserPassword,
} from "../../models/users.js";
import { issueApiKey } from "../../models/apiKeys.js";
import { currentUser } from "../session.js";
import { renderAccountPage } from "../accountView.js";

export const authRouter = Router();

const RESERVED_USERNAMES = new Set([
  "dashboard",
  "login",
  "logout",
  "signup",
  "mcp",
  "health",
  "styles.css",
  "api",
  "admin",
]);

const signupSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9-]+$/, "Username can only contain letters, numbers, and hyphens.")
    .refine((u) => !RESERVED_USERNAMES.has(u.toLowerCase()), {
      message: "That username is reserved.",
    }),
  password: z.string().min(8),
});

authRouter.get("/signup", (req, res) => {
  if (currentUser(req)) return res.redirect("/dashboard");
  res.render("auth/signup", { title: "Sign up", error: null });
});

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render("auth/signup", {
      title: "Sign up",
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      values: req.body,
    });
    return;
  }
  const { email, username, password } = parsed.data;

  if (getUserByEmail(email)) {
    res.status(400).render("auth/signup", {
      title: "Sign up",
      error: "That email is already registered.",
      values: req.body,
    });
    return;
  }
  if (getUserByUsername(username)) {
    res.status(400).render("auth/signup", {
      title: "Sign up",
      error: "That username is taken.",
      values: req.body,
    });
    return;
  }

  // Signup creates both credentials in one step: a users row (dashboard login)
  // and a first api_keys row (working MCP URL), per PRD §8.
  const user = await createUser(email, username, password);
  const { plaintext } = issueApiKey(user.id);

  (req as any).session.userId = user.id;
  (res.locals as any).user = user;
  renderAccountPage(req, res, user, {
    newPlaintextKey: plaintext,
    notice: "Account created. Here's your MCP URL — add it to your IDE now, it won't be shown again.",
  });
});

authRouter.get("/login", (req, res) => {
  if (currentUser(req)) return res.redirect("/dashboard");
  res.render("auth/login", { title: "Log in", error: null });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).render("auth/login", {
      title: "Log in",
      error: "Email and password are required.",
      values: req.body,
    });
    return;
  }
  const user = await verifyUserPassword(email, password);
  if (!user) {
    res.status(401).render("auth/login", {
      title: "Log in",
      error: "Incorrect email or password.",
      values: req.body,
    });
    return;
  }
  (req as any).session.userId = user.id;
  res.redirect("/dashboard");
});

authRouter.post("/logout", (req, res) => {
  (req as any).session = null;
  res.redirect("/");
});