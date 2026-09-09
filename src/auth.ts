import type { IncomingHttpHeaders } from "node:http";

export interface AuthenticatedUser {
  userId: string;
  apiKey: string;
}

export class AuthError extends Error {
  readonly statusCode = 401;

  constructor(message = "Missing or invalid API key") {
    super(message);
    this.name = "AuthError";
  }
}

export function loadApiKeys(value = process.env.MCP_API_KEYS ?? ""): Map<string, string> {
  const keys = new Map<string, string>();
  for (const entry of value.split(",")) {
    const separator = entry.indexOf(":");
    if (separator > 0) {
      const key = entry.slice(0, separator).trim();
      const userId = entry.slice(separator + 1).trim();
      if (key && userId) keys.set(key, userId);
    }
  }
  return keys;
}

export function authenticate(headers: IncomingHttpHeaders, apiKeys = loadApiKeys()): AuthenticatedUser {
  const header = headers["x-api-key"] ?? headers.authorization;
  const raw = Array.isArray(header) ? header[0] : header;
  const apiKey = raw?.toLowerCase().startsWith("bearer ") ? raw.slice(7).trim() : raw?.trim();
  const userId = apiKey ? apiKeys.get(apiKey) : undefined;
  if (!apiKey || !userId) throw new AuthError();
  return { apiKey, userId };
}
