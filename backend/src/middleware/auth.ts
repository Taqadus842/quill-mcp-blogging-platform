import {
    Request,
    Response,
    NextFunction,
  } from "express";
  
  import {
    verifyToken,
  } from "../services/token.service.js";
  
  export interface AuthenticatedRequest
    extends Request {
    userId?: number;
  }
  
  export function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const authorization =
        req.headers.authorization;
  
      if (!authorization) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }
  
      const [type, token] =
        authorization.split(" ");
  
      if (
        type !== "Bearer" ||
        !token
      ) {
        return res.status(401).json({
          error: "Invalid authorization header",
        });
      }
  
      const payload =
        verifyToken(token);
  
      req.userId =
        payload.userId;
  
      next();
    } catch {
      return res.status(401).json({
        error: "Invalid or expired token",
      });
    }
  }