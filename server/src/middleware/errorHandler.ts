import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[api] Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "SERVER_ERROR",
    message: "Something went wrong. Please try again later.",
  });
};
