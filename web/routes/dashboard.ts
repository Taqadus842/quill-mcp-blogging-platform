import { Router } from "express";
import * as Posts from "../../models/posts.js";
import { ValidationError } from "../../models/posts.js";
import * as Analytics from "../../models/analytics.js";
import { listApiKeysForUser, revokeApiKey, rotateApiKey } from "../../models/apiKeys.js";
import { requireLogin } from "../session.js";
import { renderAccountPage } from "../accountView.js";
import type { PostStatus } from "../../models/posts.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireLogin);

const user = (res: any) => res.locals.user;

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

function loadPostOr404(req: any, res: any): Posts.PostView | null {
  const post = Posts.getPost(req.params.id, user(res).id);
  if (!post) {
    res.status(404).render("404", { title: "Not found" });
    return null;
  }
  return post;
}

dashboardRouter.get("/", (req, res) => {
  const status = ["draft", "scheduled", "published"].includes(req.query.status as string)
    ? (req.query.status as PostStatus)
    : undefined;
  const posts = Posts.listPosts(user(res).id, { status, limit: 100 });
  res.render("dashboard/posts", { title: "Posts", posts, status: status ?? null, notice: null, error: null });
});

dashboardRouter.get("/posts/new", (req, res) => {
  res.render("dashboard/new", { title: "New post", error: null });
});

dashboardRouter.post("/posts", (req, res) => {
  const { title, content } = req.body || {};
  try {
    const post = Posts.createPost(user(res).id, { title, content, tags: parseTags(req.body.tags) });
    res.redirect(`/dashboard/posts/${post.id}`);
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : "Couldn't create that post.";
    res.status(400).render("dashboard/new", { title: "New post", error: message, values: req.body });
  }
});

dashboardRouter.get("/posts/:id", (req, res) => {
  const post = loadPostOr404(req, res);
  if (!post) return;
  res.render("dashboard/edit", { title: "Edit", post, username: user(res).username, notice: null, error: null });
});

dashboardRouter.post("/posts/:id", (req, res) => {
  const post = loadPostOr404(req, res);
  if (!post) return;
  try {
    const updated = Posts.updatePost(post.id, user(res).id, {
      title: req.body.title,
      content: req.body.content,
      tags: parseTags(req.body.tags),
    });
    res.render("dashboard/edit", { title: "Edit", post: updated, username: user(res).username, notice: "Saved.", error: null });
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : "Couldn't save that post.";
    res.status(400).render("dashboard/edit", { title: "Edit", post, username: user(res).username, notice: null, error: message });
  }
});

dashboardRouter.post("/posts/:id/delete", (req, res) => {
  try {
    Posts.deletePost(req.params.id, user(res).id);
  } catch {
    // already gone or not theirs
  }
  res.redirect("/dashboard");
});

dashboardRouter.post("/posts/:id/publish", (req, res) => {
  const post = loadPostOr404(req, res);
  if (!post) return;
  try {
    const updated = Posts.publishPost(post.id, user(res).id);
    res.render("dashboard/edit", { title: "Edit", post: updated, username: user(res).username, notice: "Published.", error: null });
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : "Couldn't publish that post.";
    res.status(400).render("dashboard/edit", { title: "Edit", post, username: user(res).username, notice: null, error: message });
  }
});

dashboardRouter.post("/posts/:id/unpublish", (req, res) => {
  const post = loadPostOr404(req, res);
  if (!post) return;
  const updated = Posts.unpublishPost(post.id, user(res).id);
  res.render("dashboard/edit", { title: "Edit", post: updated, username: user(res).username, notice: "Unpublished.", error: null });
});

dashboardRouter.post("/posts/:id/schedule", (req, res) => {
  const post = loadPostOr404(req, res);
  if (!post) return;
  try {
    // datetime-local has no timezone; treat as the server's local time
    const iso = new Date(req.body.publish_at).toISOString();
    const updated = Posts.schedulePost(post.id, user(res).id, iso);
    res.render("dashboard/edit", { title: "Edit", post: updated, username: user(res).username, notice: "Scheduled.", error: null });
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : "Couldn't schedule that post.";
    res.status(400).render("dashboard/edit", { title: "Edit", post, username: user(res).username, notice: null, error: message });
  }
});

dashboardRouter.post("/posts/:id/seo", (req, res) => {
  const post = loadPostOr404(req, res);
  if (!post) return;
  try {
    const updated = Posts.setSeo(post.id, user(res).id, {
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      slug: req.body.slug,
    });
    res.render("dashboard/edit", { title: "Edit", post: updated, username: user(res).username, notice: "SEO saved.", error: null });
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : "Couldn't save SEO settings.";
    res.status(400).render("dashboard/edit", { title: "Edit", post, username: user(res).username, notice: null, error: message });
  }
});

dashboardRouter.get("/analytics", (req, res) => {
  const range = typeof req.query.range === "string" ? req.query.range : "30d";
  res.render("dashboard/analytics", { title: "Analytics", data: Analytics.getAnalytics(user(res).id, { range }) });
});

dashboardRouter.get("/account", (req, res) => {
  renderAccountPage(req, res, user(res));
});

dashboardRouter.post("/account/keys/rotate", (req, res) => {
  const { plaintext } = rotateApiKey(user(res).id);
  renderAccountPage(req, res, user(res), {
    newPlaintextKey: plaintext,
    notice: "Key rotated. Update your IDE's MCP config with the new URL below — the old one stopped working immediately.",
  });
});

dashboardRouter.post("/account/keys/:id/revoke", (req, res) => {
  revokeApiKey(req.params.id, user(res).id);
  const stillHasActive = listApiKeysForUser(user(res).id).some((k) => !k.revoked_at);
  renderAccountPage(req, res, user(res), {
    notice: stillHasActive ? "Key revoked." : "Key revoked. You have no active MCP key — rotate to issue a new one.",
  });
});