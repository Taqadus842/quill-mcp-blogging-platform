import type { Request, Response } from "express";
import { listApiKeysForUser } from "../models/apiKeys.js";
import type { User } from "../models/users.js";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export function renderAccountPage(
  req: Request,
  res: Response,
  user: User,
  opts: { newPlaintextKey?: string; notice?: string; error?: string } = {}
) {
  const keys = listApiKeysForUser(user.id);
  const activeKey = keys.find((k) => !k.revoked_at);

  res.render("dashboard/account", {
    title: "Account",
    keys,
    newPlaintextKey: opts.newPlaintextKey ?? null,
    mcpUrl: opts.newPlaintextKey ? `${BASE_URL}/mcp/${opts.newPlaintextKey}` : null,
    activeKeyPrefix: activeKey?.key_prefix ?? null,
    notice: opts.notice ?? null,
    error: opts.error ?? null,
  });
}