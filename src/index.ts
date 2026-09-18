import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { authenticate, AuthError, loadApiKeys } from "./auth.js";
import { createMcpServer } from "./mcp.js";
import { MemoryPostService, type PostService } from "./services.js";
import { HttpPostService } from "./backend-http.js";

export function createHttpServer(postService: PostService = new MemoryPostService()) {
  const apiKeys = loadApiKeys();
  return createServer(async (request, response) => {
    if (request.url !== "/mcp") { sendJson(response, 404, { error: "Not found" }); return; }
    if (request.method === "GET") {
      sendJson(response, 200, { service: "quill-mcp", status: "ok", endpoint: "/mcp", transport: "Streamable HTTP", message: "Use POST for MCP JSON-RPC requests." });
      return;
    }
    if (request.method !== "POST") { response.setHeader("Allow", "GET, POST"); sendJson(response, 405, { error: "Only GET and POST are supported" }); return; }
    try {
      const user = authenticate(request.headers, apiKeys);
      const body = await readJson(request);
      const server = createMcpServer(user, postService);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      await transport.handleRequest(request, response, body);
    } catch (error) {
      const status = error instanceof AuthError ? error.statusCode : 400;
      if (!response.headersSent) sendJson(response, status, { error: error instanceof Error ? error.message : "Bad request" });
    }
  });
}

function readJson(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => { data += chunk; if (data.length > 1_000_000) reject(new Error("Request body too large")); });
    request.on("end", () => { try { resolve(data ? JSON.parse(data) : undefined); } catch { reject(new Error("Request body must be valid JSON")); } });
    request.on("error", reject);
  });
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
const configuredService: PostService = process.env.BACKEND_MODE === "http"
  ? new HttpPostService(process.env.QUILL_API_URL ?? "http://127.0.0.1:4000/api", process.env.QUILL_API_KEY ?? "")
  : new MemoryPostService();
if (process.env.NODE_ENV !== "test") createHttpServer(configuredService).listen(port, host, () => console.log(`Quill MCP server listening at http://${host}:${port}/mcp`));
