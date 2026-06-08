import { Router } from "express";
import rateLimit from "express-rate-limit";
import { addToWaitlist, DuplicateEmailError } from "../services/waitlistService.js";
import {
  sendWaitlistConfirmation,
  sendWaitlistAdminNotification,
} from "../services/emailService.js";
import { isValidEmail, normalizeEmail } from "../utils/validateEmail.js";

export const waitlistRouter = Router();

const waitlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "RATE_LIMITED",
    message: "Too many signup attempts. Please try again later.",
  },
});

waitlistRouter.post("/", waitlistLimiter, async (req, res) => {
  const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";

  if (!rawEmail.trim()) {
    return res.status(400).json({
      success: false,
      error: "INVALID_EMAIL",
      message: "Email is required.",
    });
  }

  if (!isValidEmail(rawEmail)) {
    return res.status(400).json({
      success: false,
      error: "INVALID_EMAIL",
      message: "Please enter a valid email address.",
    });
  }

  const email = normalizeEmail(rawEmail);

  try {
    const entry = await addToWaitlist(email);

    try {
      await Promise.all([
        sendWaitlistConfirmation(entry.email),
        sendWaitlistAdminNotification(entry.email),
      ]);
    } catch (mailError) {
      console.error("[waitlist] Email delivery failed:", mailError);
    }

    return res.status(201).json({
      success: true,
      message: "You're on the list. Check your inbox for confirmation.",
      data: { email: entry.email },
    });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return res.status(409).json({
        success: false,
        error: "DUPLICATE_EMAIL",
        message: "This email is already on the waitlist.",
      });
    }

    console.error("[waitlist] Signup failed:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Something went wrong. Please try again later.",
    });
  }
});
