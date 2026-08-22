import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { PLAN_NAMES, calcTaxableInr, type PlanId } from "../constants/pricing.js";
import { sendMail } from "./emailService.js";
import type { RenewalRow } from "./renewalService.js";

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function stateCodeFromGstin(gstin: string | null): string {
  const g = (gstin || "").replace(/\s/g, "").toUpperCase();
  return g.length >= 2 ? g.slice(0, 2) : "";
}

function gstBreakdown(taxable: number, useIgst: boolean) {
  const cgst = Math.round(taxable * 0.09 * 100) / 100;
  const sgst = Math.round(taxable * 0.09 * 100) / 100;
  const totalTax = useIgst ? Math.round(taxable * 0.18 * 100) / 100 : cgst + sgst;
  const grandTotal = Math.round((taxable + totalTax) * 100) / 100;
  return { taxable, cgst, sgst, totalTax, grandTotal, useIgst };
}

function buildRenewalEmailHtml(renewal: RenewalRow, utr: string): string {
  const seller = config.invoice;
  const taxable = calcTaxableInr(renewal.plan, renewal.users, renewal.months, renewal.extra_gb);
  const sellerCode = seller.stateCode || stateCodeFromGstin(seller.gstin) || "27";
  const buyerCode = renewal.buyer_state_code || stateCodeFromGstin(renewal.gstin);
  const gst = gstBreakdown(taxable, Boolean(buyerCode && sellerCode !== buyerCode));
  const planName = PLAN_NAMES[renewal.plan as PlanId] ?? renewal.plan;

  const taxRows = gst.useIgst
    ? `<tr><td style="padding:6px 0;">Integrated GST (18%)</td><td style="text-align:right;">₹${fmt(gst.totalTax)}</td></tr>`
    : `<tr><td style="padding:6px 0;">Central GST (9%)</td><td style="text-align:right;">₹${fmt(gst.cgst)}</td></tr>
       <tr><td style="padding:6px 0;">State GST (9%)</td><td style="text-align:right;">₹${fmt(gst.sgst)}</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Invoice ${renewal.invoice_no}</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;color:#202124;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:640px;background:#fff;border-radius:12px;padding:28px 24px;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:12px;color:#0ea5e9;text-transform:uppercase;letter-spacing:0.15em;">Kalpanik</p>
          <h1 style="margin:0 0 16px;font-size:22px;">Tax Invoice — ${renewal.invoice_no}</h1>
          <p style="margin:0 0 20px;color:#5f6368;line-height:1.6;">
            Payment proof received. UTR: <strong>${utr}</strong>
          </p>

          <h2 style="font-size:16px;margin:24px 0 8px;border-bottom:1px solid #e8eaed;padding-bottom:6px;">Seller</h2>
          <p style="margin:0;line-height:1.6;">
            <strong>${seller.legalName}</strong><br />
            ${seller.address}<br />
            GSTIN: ${seller.gstin || "—"}<br />
            ${seller.phone ? `Phone: ${seller.phone}<br />` : ""}
            Email: ${seller.email}
          </p>

          <h2 style="font-size:16px;margin:24px 0 8px;border-bottom:1px solid #e8eaed;padding-bottom:6px;">Company (Bill to)</h2>
          <p style="margin:0;line-height:1.6;">
            <strong>${renewal.company}</strong><br />
            ${renewal.contact_person ? `${renewal.contact_person}<br />` : ""}
            ${renewal.billing_address || "—"}<br />
            ${renewal.gstin ? `GSTIN: ${renewal.gstin}<br />` : ""}
            ${renewal.buyer_state ? `State: ${renewal.buyer_state}${renewal.buyer_state_code ? ` (${renewal.buyer_state_code})` : ""}<br />` : ""}
            Email: ${renewal.email}<br />
            ${renewal.phone ? `Phone: ${renewal.phone}` : ""}
          </p>

          <h2 style="font-size:16px;margin:24px 0 8px;border-bottom:1px solid #e8eaed;padding-bottom:6px;">Subscription</h2>
          <table width="100%" style="font-size:14px;line-height:1.7;">
            <tr><td>Plan</td><td style="text-align:right;"><strong>Kalpanik ${planName}</strong></td></tr>
            <tr><td>Users</td><td style="text-align:right;">${renewal.users}</td></tr>
            <tr><td>Duration</td><td style="text-align:right;">${renewal.months} month(s)</td></tr>
            ${renewal.extra_gb > 0 ? `<tr><td>Extra storage</td><td style="text-align:right;">${renewal.extra_gb} GB</td></tr>` : ""}
            ${renewal.instance ? `<tr><td>Instance</td><td style="text-align:right;">${renewal.instance}</td></tr>` : ""}
            ${renewal.site ? `<tr><td>Site</td><td style="text-align:right;">${renewal.site}</td></tr>` : ""}
            ${renewal.trial_end_extend_to ? `<tr><td>Extend to</td><td style="text-align:right;">${renewal.trial_end_extend_to}</td></tr>` : ""}
          </table>

          <h2 style="font-size:16px;margin:24px 0 8px;border-bottom:1px solid #e8eaed;padding-bottom:6px;">Bill summary</h2>
          <table width="100%" style="font-size:14px;">
            <tr><td style="padding:6px 0;">Subtotal (taxable)</td><td style="text-align:right;">₹${fmt(gst.taxable)}</td></tr>
            ${taxRows}
            <tr><td style="padding:10px 0;font-weight:700;font-size:16px;">Total</td><td style="text-align:right;font-weight:700;font-size:16px;">₹${fmt(gst.grandTotal)}</td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#80868b;">
            Status: Pending verification. We will activate your subscription after confirming payment.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPlainText(renewal: RenewalRow, utr: string): string {
  const planName = PLAN_NAMES[renewal.plan as PlanId] ?? renewal.plan;
  return [
    `Kalpanik Invoice ${renewal.invoice_no}`,
    `UTR: ${utr}`,
    "",
    "Company:",
    renewal.company,
    renewal.billing_address || "",
    renewal.gstin ? `GSTIN: ${renewal.gstin}` : "",
    `Email: ${renewal.email}`,
    "",
    "Subscription:",
    `Plan: Kalpanik ${planName}`,
    `Users: ${renewal.users}`,
    `Months: ${renewal.months}`,
    renewal.site ? `Site: ${renewal.site}` : "",
    `Amount: ₹${fmt(Number(renewal.amount_inr))}`,
    "",
    "Pending verification.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendRenewalProofEmails(
  renewal: RenewalRow,
  utr: string,
  screenshotPath?: string | null
): Promise<void> {
  const html = buildRenewalEmailHtml(renewal, utr);
  const text = buildPlainText(renewal, utr);
  const subject = `Kalpanik invoice ${renewal.invoice_no} — payment proof received`;

  const attachments: { filename: string; path: string }[] = [];
  if (screenshotPath) {
    const abs = screenshotPath.startsWith("/")
      ? path.resolve(screenshotPath.replace(/^\//, ""))
      : path.resolve(screenshotPath);
    if (fs.existsSync(abs)) {
      attachments.push({ filename: path.basename(abs), path: abs });
    }
  }

  const notifyOps = config.mail.renewalNotifyTo;

  await sendMail({
    to: renewal.email,
    subject,
    text,
    html,
    attachments: attachments.length ? attachments : undefined,
  });

  await sendMail({
    to: notifyOps,
    subject: `[Kalpanik] Payment proof — ${renewal.company} (${renewal.invoice_no})`,
    text: `${text}\n\nSubmitted by: ${renewal.email}\nCompany: ${renewal.company}`,
    html: html.replace(
      "<h1",
      `<p style="background:#fef7e0;padding:10px;border-radius:6px;"><strong>Admin copy</strong> — ${renewal.company}</p><h1`
    ),
    replyTo: renewal.email,
    attachments: attachments.length ? attachments : undefined,
  });
}
