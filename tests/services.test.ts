import { describe, expect, it } from "vitest";
import { MemoryPostService, NotFoundError } from "../src/services.js";

describe("MemoryPostService", () => {
  it("scopes reads and writes to the authenticated user", async () => {
    const service = new MemoryPostService();
    const post = await service.createPost("user-a", { title: "A post", content: "Body" });
    await expect(service.getPost("user-b", post.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.listPosts("user-b")).resolves.toEqual([]);
  });

  it("supports the requested publishing lifecycle", async () => {
    const service = new MemoryPostService();
    const post = await service.createPost("user-a", { title: "A post", content: "Body" });
    await expect(service.setStatus("user-a", post.id, "scheduled", "2030-01-01T00:00:00.000Z")).resolves.toMatchObject({ status: "scheduled" });
    await expect(service.setStatus("user-a", post.id, "published")).resolves.toMatchObject({ status: "published" });
    await expect(service.setStatus("user-a", post.id, "draft")).resolves.toMatchObject({ status: "draft" });
  });
});
