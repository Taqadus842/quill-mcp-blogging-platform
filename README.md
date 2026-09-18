# Quill MCP Server

A TypeScript MCP server for managing Quill blog content through an AI agent. It exposes the requested tools over MCP Streamable HTTP at `POST /mcp` and enforces API-key authentication before any tool is created.

## Requirements

- Node.js 20+
- npm 10+
- A Quill backend can be added behind the `PostService` interface in `src/services.ts`. The default `MemoryPostService` makes local development and tests self-contained.

## Run locally

```powershell
Copy-Item .env.example .env
npm install
npm run build
npm start
```

The default endpoint is `http://127.0.0.1:3000/mcp`. Send either `x-api-key: <key>` or `Authorization: Bearer <key>`. API keys use `key:userId` entries separated by commas, for example `dev-key:sabeen,other-key:writer-2`.

## Tools

`create_post`, `update_post`, `delete_post`, `list_posts`, `get_post`, `publish_post`, `schedule_post`, `unpublish_post`, `manage_seo`, and `get_analytics` are registered with Zod input schemas. Tool responses are JSON text. Missing records intentionally return `Post not found`, including when a record belongs to another user, so user data cannot be enumerated across accounts.

## Claude Desktop

Start the HTTP server first, then build the included stdio bridge:

```powershell
npm run build
npm start
```

Copy `claude_desktop_config.example.json` into Claude Desktop's `claude_desktop_config.json`, update the path and `MCP_API_KEY`, then restart Claude Desktop. The bridge exposes the tools over Claude Desktop's standard stdio connection and forwards calls to the Streamable HTTP server.

Keep the API key in the config environment and replace the example value with a long random key. Do not commit `.env` or real keys.

## Sample prompts

- "Create a draft Quill post titled 'A practical guide to MCP' with a concise introduction and tags mcp and quill."
- "List my scheduled posts."
- "Update the post with ID `<id>` to improve its excerpt and SEO description."
- "Schedule post `<id>` for 2030-01-01T09:00:00.000Z."
- "Publish post `<id>`, then show its analytics."
- "Unpublish post `<id>` and return it to draft status."

## Validation

```powershell
npm run typecheck
npm test
npm run build
```

The repository includes service-level tests for ownership isolation and the publishing lifecycle. A live Claude Desktop connection requires Node.js and Claude Desktop; the bridge avoids requiring native Streamable HTTP support in the desktop client.
