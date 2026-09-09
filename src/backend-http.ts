import type { Analytics, Post, PostInput, PostStatus, SeoSettings } from "./models.js";
import type { PostService } from "./services.js";

/** Adapter for the shared Quill API. The API is responsible for applying the same user scope server-side. */
export class HttpPostService implements PostService {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}
  createPost(userId: string, input: PostInput) { return this.request<Post>("POST", "/posts", userId, input); }
  updatePost(userId: string, postId: string, input: Partial<PostInput>) { return this.request<Post>("PATCH", `/posts/${postId}`, userId, input); }
  deletePost(userId: string, postId: string) { return this.request<{ id: string; deleted: true }>("DELETE", `/posts/${postId}`, userId); }
  listPosts(userId: string, status?: PostStatus) { return this.request<Post[]>("GET", `/posts${status ? `?status=${encodeURIComponent(status)}` : ""}`, userId); }
  getPost(userId: string, postId: string) { return this.request<Post>("GET", `/posts/${postId}`, userId); }
  setStatus(userId: string, postId: string, status: PostStatus, scheduledAt?: string) { return this.request<Post>("POST", `/posts/${postId}/${status}`, userId, scheduledAt ? { scheduledAt } : undefined); }
  updateSeo(userId: string, postId: string, seo: SeoSettings) { return this.request<Post>("PATCH", `/posts/${postId}/seo`, userId, seo); }
  getAnalytics(userId: string, postId: string, period?: { from?: string; to?: string }) { return this.request<Analytics>("GET", `/posts/${postId}/analytics`, userId, undefined, period); }
  private async request<T>(method: string, path: string, userId: string, body?: unknown, query?: { from?: string; to?: string }): Promise<T> {
    const url = new URL(path, this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`);
    for (const [key, value] of Object.entries(query ?? {})) if (value) url.searchParams.set(key, value);
    const response = await fetch(url, { method, headers: { authorization: `Bearer ${this.apiKey}`, "x-user-id": userId, ...(body === undefined ? {} : { "content-type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) throw new Error(`Quill API request failed (${response.status})`);
    return response.json() as Promise<T>;
  }
}
