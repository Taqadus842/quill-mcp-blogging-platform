import { randomUUID } from "node:crypto";
import type { Analytics, Post, PostInput, PostStatus, SeoSettings } from "./models.js";

export class NotFoundError extends Error {
  readonly statusCode = 404;
}

export class ValidationError extends Error {
  readonly statusCode = 400;
}

export interface PostService {
  createPost(userId: string, input: PostInput): Promise<Post>;
  updatePost(userId: string, postId: string, input: Partial<PostInput>): Promise<Post>;
  deletePost(userId: string, postId: string): Promise<{ id: string; deleted: true }>;
  listPosts(userId: string, status?: PostStatus): Promise<Post[]>;
  getPost(userId: string, postId: string): Promise<Post>;
  setStatus(userId: string, postId: string, status: PostStatus, scheduledAt?: string): Promise<Post>;
  updateSeo(userId: string, postId: string, seo: SeoSettings): Promise<Post>;
  getAnalytics(userId: string, postId: string, period?: { from?: string; to?: string }): Promise<Analytics>;
}

export class MemoryPostService implements PostService {
  private readonly posts = new Map<string, Post>();

  async createPost(userId: string, input: PostInput): Promise<Post> {
    if (!input.title.trim() || !input.content.trim()) throw new ValidationError("title and content are required");
    const now = new Date().toISOString();
    const post: Post = { id: randomUUID(), userId, title: input.title, slug: input.slug ?? slugify(input.title), content: input.content, excerpt: input.excerpt, status: "draft", tags: input.tags ?? [], seo: input.seo, createdAt: now, updatedAt: now };
    this.posts.set(post.id, post);
    return post;
  }

  async updatePost(userId: string, postId: string, input: Partial<PostInput>): Promise<Post> {
    const post = this.getOwned(userId, postId);
    const updated = { ...post, ...input, slug: input.slug ?? post.slug, tags: input.tags ?? post.tags, updatedAt: new Date().toISOString() };
    this.posts.set(postId, updated);
    return updated;
  }

  async deletePost(userId: string, postId: string): Promise<{ id: string; deleted: true }> {
    this.getOwned(userId, postId);
    this.posts.delete(postId);
    return { id: postId, deleted: true };
  }

  async listPosts(userId: string, status?: PostStatus): Promise<Post[]> {
    return [...this.posts.values()].filter((post) => post.userId === userId && (!status || post.status === status));
  }

  async getPost(userId: string, postId: string): Promise<Post> { return this.getOwned(userId, postId); }

  async setStatus(userId: string, postId: string, status: PostStatus, scheduledAt?: string): Promise<Post> {
    const post = this.getOwned(userId, postId);
    if (status === "scheduled" && !scheduledAt) throw new ValidationError("scheduledAt is required when scheduling a post");
    const updated = { ...post, status, scheduledAt: status === "scheduled" ? scheduledAt : undefined, publishedAt: status === "published" ? new Date().toISOString() : post.publishedAt, updatedAt: new Date().toISOString() };
    this.posts.set(postId, updated);
    return updated;
  }

  async updateSeo(userId: string, postId: string, seo: SeoSettings): Promise<Post> {
    const post = this.getOwned(userId, postId);
    const updated = { ...post, seo: { ...post.seo, ...seo }, updatedAt: new Date().toISOString() };
    this.posts.set(postId, updated);
    return updated;
  }

  async getAnalytics(userId: string, postId: string, period = {}): Promise<Analytics> {
    const post = this.getOwned(userId, postId);
    return { postId: post.id, views: 0, uniqueVisitors: 0, publishedAt: post.publishedAt, period };
  }

  private getOwned(userId: string, postId: string): Post {
    const post = this.posts.get(postId);
    if (!post || post.userId !== userId) throw new NotFoundError("Post not found");
    return post;
  }
}

function slugify(value: string): string { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
