import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { config } from "../config.js";
import { isPlanId } from "../constants/pricing.js";
import {
  createRenewal,
  getRenewalByInvoice,
  serializeRenewal,
  submitPaymentProof,
} from "../services/renewalService.js";

export const renewalsRouter = Router();

const uploadDir = path.resolve("uploads/renewals");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image screenshots are allowed"));
      return;
    }
    cb(null, true);
  },
});

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

renewalsRouter.get("/config", (_req, res) => {
  res.json({
    success: true,
    data: {
      upiId: config.upi.id,
      upiName: config.upi.name,
      company: config.invoice,
    },
  });
});

renewalsRouter.post("/", createLimiter, async (req, res) => {
  try {
    const plan = typeof req.body?.plan === "string" ? req.body.plan : "";
    if (!isPlanId(plan)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_PLAN",
        message: "Plan must be task_management or task_attendance.",
      });
    }

    const company = typeof req.body?.company === "string" ? req.body.company : "";
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    if (!company.trim() || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: "INVALID_INPUT",
        message: "Company and email are required.",
      });
    }

    const renewal = await createRenewal({
      instance: typeof req.body?.instance === "string" ? req.body.instance : undefined,
      site: typeof req.body?.site === "string" ? req.body.site : undefined,
      company,
      email,
      phone: typeof req.body?.phone === "string" ? req.body.phone : undefined,
      users: Number(req.body?.users) || 1,
      plan,
      months: Number(req.body?.months) || 1,
      extraGb: Number(req.body?.extraGb) || 0,
      trialEnd: typeof req.body?.trialEnd === "string" ? req.body.trialEnd : undefined,
      billingAddress:
        typeof req.body?.billingAddress === "string" ? req.body.billingAddress : undefined,
      gstin: typeof req.body?.gstin === "string" ? req.body.gstin : undefined,
      source: typeof req.body?.source === "string" ? req.body.source : "website",
    });

    return res.status(201).json({
      success: true,
      data: serializeRenewal(renewal),
      payment: {
        upiId: config.upi.id,
        upiName: config.upi.name,
        amount: Number(renewal.amount_inr),
        upiUri: buildUpiUri(
          config.upi.id,
          config.upi.name,
          Number(renewal.amount_inr),
          renewal.invoice_no
        ),
      },
    });
  } catch (error) {
    console.error("[renewals] Create failed:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to create renewal.",
    });
  }
});

renewalsRouter.get("/:invoiceNo", async (req, res) => {
  try {
    const invoiceNo = String(req.params.invoiceNo);
    const renewal = await getRenewalByInvoice(invoiceNo);
    if (!renewal) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Invoice not found.",
      });
    }

    return res.json({
      success: true,
      data: serializeRenewal(renewal),
      payment: {
        upiId: config.upi.id,
        upiName: config.upi.name,
        amount: Number(renewal.amount_inr),
        upiUri: buildUpiUri(
          config.upi.id,
          config.upi.name,
          Number(renewal.amount_inr),
          renewal.invoice_no
        ),
      },
      invoice: config.invoice,
    });
  } catch (error) {
    console.error("[renewals] Get failed:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to load renewal.",
    });
  }
});

renewalsRouter.post("/:invoiceNo/proof", createLimiter, (req, res) => {
  upload.single("screenshot")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: "UPLOAD_ERROR",
        message: err instanceof Error ? err.message : "Upload failed.",
      });
    }

    try {
      const utr = typeof req.body?.utr === "string" ? req.body.utr.trim() : "";
      if (!utr) {
        return res.status(400).json({
          success: false,
          error: "INVALID_UTR",
          message: "UTR / transaction reference is required.",
        });
      }

      const screenshotPath = req.file ? `/uploads/renewals/${req.file.filename}` : null;
      const invoiceNo = String(req.params.invoiceNo);
      const renewal = await submitPaymentProof(invoiceNo, utr, screenshotPath);

      return res.json({
        success: true,
        message: "Payment proof submitted. We will activate after verification.",
        data: serializeRenewal(renewal),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit proof.";
      const status = message.includes("not found") ? 404 : 400;
      return res.status(status).json({
        success: false,
        error: "PROOF_ERROR",
        message,
      });
    }
  });
});

function buildUpiUri(pa: string, pn: string, amount: number, invoiceNo: string): string {
  const params = new URLSearchParams({
    pa,
    pn,
    am: amount.toFixed(2),
    cu: "INR",
    tn: invoiceNo,
  });
  return `upi://pay?${params.toString()}`;
}
