import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export interface TokenPayload {
  userId: number;
}

export function createToken(
  userId: number
) {
  return jwt.sign(
    {
      userId,
    },
    env.jwtSecret,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyToken(
  token: string
): TokenPayload {
  return jwt.verify(
    token,
    env.jwtSecret
  ) as TokenPayload;
}