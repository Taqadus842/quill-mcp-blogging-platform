import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z, type ZodTypeAny } from "zod";

const endpoint = new URL(process.env.MCP_SERVER_URL ?? "http://127.0.0.1:3000/mcp");
const apiKey = process.env.MCP_API_KEY;
if (!apiKey) throw new Error("MCP_API_KEY is required for the Claude Desktop bridge");

const client = new Client({ name: "quill-claude-bridge", version: "1.0.0" });
const remote = new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { "x-api-key": apiKey } } });
await client.connect(remote);
const remoteTools = await client.listTools();
const server = new McpServer({ name: "quill-claude-bridge", version: "1.0.0" });
for (const tool of remoteTools.tools) {
  server.registerTool(tool.name, { description: tool.description, inputSchema: jsonSchemaToZodShape(tool.inputSchema) }, async (args: Record<string, unknown>) => {
    const response = await client.callTool({ name: tool.name, arguments: args });
    return response as { content: Array<{ type: "text"; text: string }>; isError?: boolean };
  });
}
await server.connect(new StdioServerTransport());

function jsonSchemaToZodShape(schema: Record<string, unknown>): Record<string, ZodTypeAny> {
  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const required = new Set(Array.isArray(schema.required) ? schema.required : []);
  return Object.fromEntries(Object.entries(properties).map(([name, definition]) => {
    let value: ZodTypeAny;
    if (Array.isArray(definition.enum)) value = z.enum(definition.enum as [string, ...string[]]);
    else if (definition.type === "array") value = z.array(z.string());
    else if (definition.type === "object") value = z.record(z.unknown());
    else if (definition.type === "boolean") value = z.boolean();
    else if (definition.type === "number" || definition.type === "integer") value = z.number();
    else value = z.string();
    return [name, required.has(name) ? value : value.optional()];
  }));
}
