import { Router } from "express";
import rateLimit from "express-rate-limit";
import { issueAdminToken, validateAdminCredentials } from "../services/authService.js";
import { getDashboardStats } from "../services/analyticsService.js";
import { requireAdmin, type AuthenticatedRequest } from "../middleware/requireAdmin.js";

export const adminRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "RATE_LIMITED",
    message: "Too many login attempts. Try again later.",
  },
});

adminRouter.post("/login", loginLimiter, (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email.trim() || !password) {
    return res.status(400).json({
      success: false,
      error: "INVALID_CREDENTIALS",
      message: "Email and password are required.",
    });
  }

  if (!validateAdminCredentials(email, password)) {
    return res.status(401).json({
      success: false,
      error: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
  }

  const token = issueAdminToken(email);
  return res.json({
    success: true,
    token,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "24h",
  });
});

adminRouter.get("/me", requireAdmin, (req: AuthenticatedRequest, res) => {
  return res.json({
    success: true,
    admin: { email: req.admin!.email },
  });
});

adminRouter.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const stats = await getDashboardStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error("[admin] Stats failed:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to load dashboard stats.",
    });
  }
});
