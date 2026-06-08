import type { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../services/authService.js";

export interface AuthenticatedRequest extends Request {
  admin?: { email: string };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: "TOKEN_EXPIRED",
      message: "Session expired. Please log in again.",
    });
  }

  req.admin = { email: payload.sub };
  next();
}
