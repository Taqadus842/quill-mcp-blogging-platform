import { Router } from "express";
import * as Posts from "../../models/posts.js";
import { recordView } from "../../models/analytics.js";
import { renderMarkdown } from "../markdown.js";

export const publicRouter = Router();

// known app routes that shouldn't be swallowed by the :username wildcard
const RESERVED = new Set(["dashboard", "login", "logout", "signup", "mcp", "health", "styles.css"]);

// GET /:username — a user's published posts, newest first
publicRouter.get("/:username", (req, res, next) => {
  const { username } = req.params;
  if (RESERVED.has(username)) return next();

  const posts = Posts.listPublishedPostsByUsername(username);
  res.render("public/blog_index", { title: username, username, posts });
});

// GET /:username/:slug — a single published post
publicRouter.get("/:username/:slug", (req, res) => {
  const { username, slug } = req.params;
  const post = Posts.getPublishedPostBySlug(username, slug);
  if (!post) {
    res.status(404).render("404", { title: "Not found" });
    return;
  }

  recordView(post.id, (req.get("referer") as string) || null);

  res.render("public/post", { title: post.title, post, contentHtml: renderMarkdown(post.content_md) });
});