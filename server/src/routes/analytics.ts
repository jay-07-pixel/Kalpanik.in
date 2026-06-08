import { Router } from "express";
import rateLimit from "express-rate-limit";
import { trackVisit } from "../services/analyticsService.js";

export const analyticsRouter = Router();

const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const VISITOR_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

analyticsRouter.post("/track", trackLimiter, async (req, res) => {
  const visitorId = typeof req.body?.visitorId === "string" ? req.body.visitorId.trim() : "";
  const path = typeof req.body?.path === "string" ? req.body.path : "/";
  const referrer = typeof req.body?.referrer === "string" ? req.body.referrer : null;

  if (!VISITOR_ID_REGEX.test(visitorId)) {
    return res.status(400).json({
      success: false,
      error: "INVALID_VISITOR_ID",
      message: "Invalid visitor identifier.",
    });
  }

  try {
    await trackVisit({
      visitorId,
      path,
      referrer,
      userAgent: req.headers["user-agent"] ?? "",
      headers: req.headers as Record<string, string | string[] | undefined>,
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("[analytics] Track failed:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to record visit.",
    });
  }
});
