import { Router } from "express";
import rateLimit from "express-rate-limit";
import { issueAdminToken, validateAdminCredentials } from "../services/authService.js";
import { getDashboardStats } from "../services/analyticsService.js";
import { requireAdmin, type AuthenticatedRequest } from "../middleware/requireAdmin.js";
import {
  getRenewalByInvoice,
  listRenewals,
  markRenewalPaid,
  serializeRenewal,
  syncRenewalActivation,
  updateRenewalSubscription,
  markRenewalManualActivation,
} from "../services/renewalService.js";
import { INSTANCE_FOLDERS, isPlanId } from "../constants/pricing.js";
import { buildRenewalBillDocument } from "../services/renewalEmailService.js";
import { getCompaniesOverview } from "../services/companyOverviewService.js";

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

adminRouter.get("/companies", requireAdmin, async (_req, res) => {
  try {
    const data = await getCompaniesOverview();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[admin] Companies overview failed:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to load companies.",
    });
  }
});

adminRouter.get("/renewals", requireAdmin, async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const rows = await listRenewals(status);
    return res.json({
      success: true,
      data: rows.map(serializeRenewal),
      instanceFolders: INSTANCE_FOLDERS,
    });
  } catch (error) {
    console.error("[admin] Renewals list failed:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to load renewals.",
    });
  }
});

adminRouter.get("/renewals/:invoiceNo/bill", requireAdmin, async (req, res) => {
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
    if (!renewal.utr?.trim()) {
      return res.status(400).json({
        success: false,
        error: "NO_PROOF",
        message: "Customer has not submitted payment proof yet.",
      });
    }

    const html = buildRenewalBillDocument(renewal);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${invoiceNo}.html"`
    );
    return res.send(html);
  } catch (error) {
    console.error("[admin] Bill download failed:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to generate bill.",
    });
  }
});

adminRouter.post("/renewals/:invoiceNo/mark-paid", requireAdmin, async (req, res) => {
  try {
    const invoiceNo = String(req.params.invoiceNo);
    const result = await markRenewalPaid(invoiceNo);
    return res.json({
      success: true,
      data: serializeRenewal(result.renewal),
      activation: result.activation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark paid.";
    const status = message.includes("not found") ? 404 : 500;
    console.error("[admin] Mark paid failed:", error);
    return res.status(status).json({
      success: false,
      error: "MARK_PAID_ERROR",
      message,
    });
  }
});

adminRouter.patch("/renewals/:invoiceNo", requireAdmin, async (req, res) => {
  try {
    const invoiceNo = String(req.params.invoiceNo);
    const plan = typeof req.body?.plan === "string" ? req.body.plan : undefined;
    if (plan !== undefined && !isPlanId(plan)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_PLAN",
        message: "Plan must be task_management or task_attendance.",
      });
    }

    const result = await updateRenewalSubscription(invoiceNo, {
      plan,
      users: req.body?.users !== undefined ? Number(req.body.users) : undefined,
      months: req.body?.months !== undefined ? Number(req.body.months) : undefined,
      extraGb: req.body?.extraGb !== undefined ? Number(req.body.extraGb) : undefined,
      trialEndExtendTo:
        typeof req.body?.trialEndExtendTo === "string" ? req.body.trialEndExtendTo : undefined,
      site: typeof req.body?.site === "string" ? req.body.site : undefined,
      syncToSite: req.body?.syncToSite === true,
    });

    return res.json({
      success: true,
      data: serializeRenewal(result.renewal),
      activation: result.activation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update renewal.";
    const status = message.includes("not found") ? 404 : 500;
    console.error("[admin] Renewal update failed:", error);
    return res.status(status).json({
      success: false,
      error: "UPDATE_RENEWAL_ERROR",
      message,
    });
  }
});

adminRouter.post("/renewals/:invoiceNo/sync", requireAdmin, async (req, res) => {
  try {
    const invoiceNo = String(req.params.invoiceNo);
    const result = await syncRenewalActivation(invoiceNo);
    return res.json({
      success: true,
      data: serializeRenewal(result.renewal),
      activation: result.activation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync renewal.";
    const status = message.includes("not found") ? 404 : 500;
    console.error("[admin] Renewal sync failed:", error);
    return res.status(status).json({
      success: false,
      error: "SYNC_RENEWAL_ERROR",
      message,
    });
  }
});

adminRouter.post("/renewals/:invoiceNo/mark-manual", requireAdmin, async (req, res) => {
  try {
    const invoiceNo = String(req.params.invoiceNo);
    const renewal = await markRenewalManualActivation(invoiceNo);
    return res.json({
      success: true,
      data: serializeRenewal(renewal),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark manual activation.";
    const status = message.includes("not found") ? 404 : 500;
    console.error("[admin] Manual activation failed:", error);
    return res.status(status).json({
      success: false,
      error: "MANUAL_ACTIVATION_ERROR",
      message,
    });
  }
});

adminRouter.get("/renewals/:invoiceNo", requireAdmin, async (req, res) => {
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
      instanceFolders: INSTANCE_FOLDERS,
    });
  } catch (error) {
    console.error("[admin] Renewal lookup failed:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to load renewal.",
    });
  }
});
