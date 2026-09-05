import type { Request, Response, NextFunction } from "express";
import { getUserById, type User } from "../models/users.js";

export interface SessionData {
  userId?: string;
}

export function currentUser(req: Request): User | null {
  const userId = (req as any).session?.userId as string | undefined;
  if (!userId) return null;
  return getUserById(userId) ?? null;
}

export function requireLogin(req: Request, res: Response, next: NextFunction) {
  const user = currentUser(req);
  if (!user) {
    res.redirect("/login");
    return;
  }
  (res.locals as any).user = user;
  next();
}

export function attachUser(req: Request, res: Response, next: NextFunction) {
  (res.locals as any).user = currentUser(req);
  next();
}
