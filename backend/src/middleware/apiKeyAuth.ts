import {
    Request,
    Response,
    NextFunction,
  } from "express";
  
  import {
    verifyApiKey,
  } from "../services/apiKey.service.js";
  
  export interface ApiKeyRequest
    extends Request {
    userId?: number;
    apiKeyId?: number;
  }
  
  export function requireApiKey(
    req: ApiKeyRequest,
    res: Response,
    next: NextFunction
  ) {
    const authorization =
      req.headers.authorization;
  
    if (!authorization) {
      return res.status(401).json({
        error: "API key required",
      });
    }
  
    const [type, key] =
      authorization.split(" ");
  
    if (
      type !== "Bearer" ||
      !key
    ) {
      return res.status(401).json({
        error:
          "Invalid API key authorization",
      });
    }
  
    const apiKey =
      verifyApiKey(key);
  
    if (!apiKey) {
      return res.status(401).json({
        error:
          "Invalid or revoked API key",
      });
    }
  
    req.userId =
      apiKey.user_id;
  
    req.apiKeyId =
      apiKey.id;
  
    next();
  }