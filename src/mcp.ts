import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AuthenticatedUser } from "./auth.js";
import { NotFoundError, ValidationError, type PostService } from "./services.js";

const postFields = {
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seo: z.object({ metaTitle: z.string().optional(), metaDescription: z.string().optional(), canonicalUrl: z.string().url().optional(), noIndex: z.boolean().optional() }).optional()
};
const postCreateFields = { ...postFields, title: z.string().min(1), content: z.string().min(1) };
const idField = { postId: z.string().min(1) };

export function createMcpServer(user: AuthenticatedUser, posts: PostService): McpServer {
  const server = new McpServer({ name: "quill-blog", version: "1.0.0" });
  const result = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
  const failure = (error: unknown) => ({ ...result({ error: error instanceof Error ? error.message : "Unexpected error" }), isError: true });
  const run = async (operation: () => Promise<unknown>) => { try { return result(await operation()); } catch (error) { return failure(error); } };

  server.registerTool("create_post", { description: "Create a draft post in the authenticated user's Quill blog.", inputSchema: postCreateFields }, async (input) => run(() => posts.createPost(user.userId, input)));
  server.registerTool("update_post", { description: "Update a post owned by the authenticated user.", inputSchema: { ...idField, ...postFields } }, async ({ postId, ...input }) => run(() => posts.updatePost(user.userId, postId, input)));
  server.registerTool("delete_post", { description: "Delete a post owned by the authenticated user.", inputSchema: idField }, async ({ postId }) => run(() => posts.deletePost(user.userId, postId)));
  server.registerTool("list_posts", { description: "List posts belonging only to the authenticated user.", inputSchema: { status: z.enum(["draft", "published", "scheduled"]).optional() } }, async ({ status }) => run(() => posts.listPosts(user.userId, status)));
  server.registerTool("get_post", { description: "Get a post owned by the authenticated user.", inputSchema: idField }, async ({ postId }) => run(() => posts.getPost(user.userId, postId)));
  server.registerTool("publish_post", { description: "Publish a post owned by the authenticated user.", inputSchema: idField }, async ({ postId }) => run(() => posts.setStatus(user.userId, postId, "published")));
  server.registerTool("schedule_post", { description: "Schedule a post owned by the authenticated user.", inputSchema: { ...idField, scheduledAt: z.string().datetime() } }, async ({ postId, scheduledAt }) => run(() => posts.setStatus(user.userId, postId, "scheduled", scheduledAt)));
  server.registerTool("unpublish_post", { description: "Return a published or scheduled post to draft.", inputSchema: idField }, async ({ postId }) => run(() => posts.setStatus(user.userId, postId, "draft")));
  server.registerTool("manage_seo", { description: "Read or update SEO metadata for a post owned by the authenticated user.", inputSchema: { ...idField, operation: z.enum(["get", "update"]), seo: z.object({ metaTitle: z.string().optional(), metaDescription: z.string().optional(), canonicalUrl: z.string().url().optional(), noIndex: z.boolean().optional() }).optional() } }, async ({ postId, operation, seo }) => run(async () => { if (operation === "get") return (await posts.getPost(user.userId, postId)).seo ?? {}; if (!seo) throw new ValidationError("seo is required for update"); return posts.updateSeo(user.userId, postId, seo); }));
  server.registerTool("get_analytics", { description: "Get analytics for a post owned by the authenticated user.", inputSchema: { ...idField, from: z.string().datetime().optional(), to: z.string().datetime().optional() } }, async ({ postId, from, to }) => run(() => posts.getAnalytics(user.userId, postId, { from, to })));
  return server;
}

export function isExpectedToolError(error: unknown): boolean { return error instanceof NotFoundError || error instanceof ValidationError; }
