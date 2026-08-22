import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db/pool.js";
import {
  calcAmountInr,
  calcGrandTotalInr,
  calcTaxableInr,
  extendTrialEnd,
  isPlanId,
  TEST_FLAT_BILL_INR,
  type PlanId,
  INSTANCE_FOLDERS,
} from "../constants/pricing.js";
import { config } from "../config.js";
import { sendRenewalProofEmails } from "./renewalEmailService.js";

export type RenewalStatus = "draft" | "pending" | "paid" | "failed" | "cancelled";

export interface RenewalRow extends RowDataPacket {
  id: number;
  invoice_no: string;
  instance: string | null;
  site: string | null;
  company: string;
  email: string;
  phone: string | null;
  users: number;
  plan: PlanId;
  months: number;
  extra_gb: number;
  amount_inr: number;
  trial_end: string | null;
  billing_address: string | null;
  gstin: string | null;
  contact_person: string | null;
  buyer_state: string | null;
  buyer_state_code: string | null;
  source: string | null;
  status: RenewalStatus;
  utr: string | null;
  screenshot_path: string | null;
  paid_at: Date | null;
  activated_at: Date | null;
  activation_status: string | null;
  activation_note: string | null;
  trial_end_extend_to: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRenewalInput {
  instance?: string;
  site?: string;
  company: string;
  email: string;
  phone?: string;
  users: number;
  plan: PlanId;
  months: number;
  extraGb: number;
  trialEnd?: string;
  billingAddress?: string;
  gstin?: string;
  contactPerson?: string;
  buyerState?: string;
  buyerStateCode?: string;
  source?: string;
}

function nextInvoiceNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `KLP-${y}${m}${d}-${rand}`;
}

export async function createRenewal(input: CreateRenewalInput): Promise<RenewalRow> {
  if (!isPlanId(input.plan)) throw new Error("Invalid plan");
  if (!input.company.trim() || !input.email.trim()) throw new Error("Company and email required");

  const users = Math.max(1, Math.floor(input.users));
  const months = Math.max(1, Math.floor(input.months));
  const extraGb = Math.max(0, Math.floor(input.extraGb));
  const amount = calcAmountInr(input.plan, users, months, extraGb);
  const invoiceNo = nextInvoiceNo();
  const trialEndExtendTo = extendTrialEnd(input.trialEnd, months);

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO renewals
      (invoice_no, instance, site, company, email, phone, users, plan, months, extra_gb,
       amount_inr, trial_end, billing_address, gstin, contact_person, buyer_state, buyer_state_code,
       source, status, trial_end_extend_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      invoiceNo,
      input.instance?.trim() || null,
      input.site?.trim() || null,
      input.company.trim(),
      input.email.trim().toLowerCase(),
      input.phone?.trim() || null,
      users,
      input.plan,
      months,
      extraGb,
      amount,
      input.trialEnd || null,
      input.billingAddress?.trim() || null,
      input.gstin?.trim() || null,
      input.contactPerson?.trim() || null,
      input.buyerState?.trim() || null,
      input.buyerStateCode?.trim() || null,
      input.source?.trim() || "website",
      trialEndExtendTo,
    ]
  );

  const row = await getRenewalById(result.insertId);
  if (!row) throw new Error("Failed to load renewal");
  return row;
}

export async function getRenewalById(id: number): Promise<RenewalRow | null> {
  const [rows] = await pool.query<RenewalRow[]>("SELECT * FROM renewals WHERE id = ?", [id]);
  return rows[0] ?? null;
}

export async function getRenewalByInvoice(invoiceNo: string): Promise<RenewalRow | null> {
  const [rows] = await pool.query<RenewalRow[]>("SELECT * FROM renewals WHERE invoice_no = ?", [
    invoiceNo,
  ]);
  return rows[0] ?? null;
}

export async function submitPaymentProof(
  invoiceNo: string,
  utr: string,
  screenshotPath?: string | null
): Promise<RenewalRow> {
  const renewal = await getRenewalByInvoice(invoiceNo);
  if (!renewal) throw new Error("Renewal not found");
  if (renewal.status === "paid") throw new Error("Already paid");

  const isFirstProof = !renewal.utr?.trim();

  await pool.execute(
    `UPDATE renewals SET utr = ?, screenshot_path = COALESCE(?, screenshot_path), status = 'pending', updated_at = NOW()
     WHERE invoice_no = ?`,
    [utr.trim(), screenshotPath ?? null, invoiceNo]
  );

  const updated = await getRenewalByInvoice(invoiceNo);
  if (!updated) throw new Error("Renewal not found after update");

  if (isFirstProof) {
    sendRenewalProofEmails(updated, utr.trim(), screenshotPath).catch((err) => {
      console.error("[renewals] Proof email failed:", err);
    });
  }

  return updated;
}

export async function listRenewals(status?: string): Promise<RenewalRow[]> {
  const proofOnly = "utr IS NOT NULL AND TRIM(utr) <> ''";

  if (status === "pending" || status === "submitted") {
    const [rows] = await pool.query<RenewalRow[]>(
      `SELECT * FROM renewals WHERE status = 'pending' AND ${proofOnly} ORDER BY updated_at DESC LIMIT 200`
    );
    return rows;
  }
  if (status === "paid") {
    const [rows] = await pool.query<RenewalRow[]>(
      "SELECT * FROM renewals WHERE status = 'paid' ORDER BY paid_at DESC, created_at DESC LIMIT 200"
    );
    return rows;
  }
  const [rows] = await pool.query<RenewalRow[]>(
    `SELECT * FROM renewals WHERE ${proofOnly} ORDER BY created_at DESC LIMIT 200`
  );
  return rows;
}

function stripHtml(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractWebhookDetail(body: string): string {
  const preMatch = body.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (preMatch?.[1]?.trim()) return preMatch[1].trim();
  const stripped = stripHtml(body);
  return stripped.length > 160 ? `${stripped.slice(0, 160)}…` : stripped;
}

function manualActivationHint(renewal: RenewalRow): string {
  const folder = INSTANCE_FOLDERS[renewal.instance ?? ""] ?? renewal.instance ?? "VPS folder";
  const extend = renewal.trial_end_extend_to ?? "—";
  return `Manual: set COMPANY_TRIAL_END=${extend} on ${folder}`;
}

export function formatActivationNoteForDisplay(note: string | null | undefined): string | null {
  if (!note?.trim()) return null;
  const trimmed = note.trim();
  if (!/<!DOCTYPE|<html|<pre/i.test(trimmed)) return trimmed;

  const statusMatch = trimmed.match(/Webhook (\d+)/i);
  const status = statusMatch?.[1];
  const htmlChunk = trimmed.match(/Webhook \d+:\s*([\s\S]*?)(?:\.\s*Manual:|$)/i)?.[1] ?? trimmed;
  const detail = extractWebhookDetail(htmlChunk);
  const manual = trimmed.includes("Manual:")
    ? trimmed.slice(trimmed.indexOf("Manual:")).replace(/^Manual:\s*/, "Manual: ")
    : "";

  if (status && detail) {
    return manual
      ? `Site error ${status}: ${detail}. ${manual}`
      : `Site error ${status}: ${detail}`;
  }

  const cleaned = stripHtml(trimmed);
  return cleaned.length > 220 ? `${cleaned.slice(0, 220)}…` : cleaned;
}

function formatWebhookFailure(status: number, body: string, renewal: RenewalRow): string {
  const detail = extractWebhookDetail(body);
  const manual = manualActivationHint(renewal);
  return detail
    ? `Site error ${status}: ${detail}. ${manual}`
    : `Site error ${status}. ${manual}`;
}

async function callActivationWebhook(renewal: RenewalRow): Promise<{
  ok: boolean;
  note: string;
}> {
  const site = renewal.site?.replace(/\/$/, "");
  if (!site) {
    return {
      ok: false,
      note: `No site URL. ${manualActivationHint(renewal)}`,
    };
  }

  const url = `${site}/api/company/subscription/activate`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kalpanik-Secret": config.activation.secret,
      },
      body: JSON.stringify({
        instance: renewal.instance,
        invoiceNo: renewal.invoice_no,
        plan: renewal.plan,
        users: renewal.users,
        months: renewal.months,
        extraGb: renewal.extra_gb,
        paidAt: renewal.paid_at?.toISOString?.() ?? new Date().toISOString(),
        amountInr: Number(renewal.amount_inr),
        trialEndExtendTo: renewal.trial_end_extend_to,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        note: formatWebhookFailure(res.status, text, renewal),
      };
    }

    return { ok: true, note: `Synced to ${site}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Connection failed";
    return {
      ok: false,
      note: `${msg}. ${manualActivationHint(renewal)}`,
    };
  }
}

export interface UpdateRenewalInput {
  plan?: PlanId;
  users?: number;
  months?: number;
  extraGb?: number;
  trialEndExtendTo?: string;
  site?: string;
  syncToSite?: boolean;
}

export async function updateRenewalSubscription(
  invoiceNo: string,
  input: UpdateRenewalInput
): Promise<{
  renewal: RenewalRow;
  activation?: { ok: boolean; note: string };
}> {
  const renewal = await getRenewalByInvoice(invoiceNo);
  if (!renewal) throw new Error("Renewal not found");

  const plan = input.plan && isPlanId(input.plan) ? input.plan : renewal.plan;
  if (input.plan && !isPlanId(input.plan)) throw new Error("Invalid plan");

  const users =
    input.users !== undefined ? Math.max(1, Math.floor(input.users)) : renewal.users;
  const months =
    input.months !== undefined ? Math.max(1, Math.floor(input.months)) : renewal.months;
  const extraGb =
    input.extraGb !== undefined ? Math.max(0, Math.floor(input.extraGb)) : renewal.extra_gb;
  const trialEndExtendTo =
    input.trialEndExtendTo !== undefined
      ? input.trialEndExtendTo.trim() || null
      : renewal.trial_end_extend_to;
  const site = input.site !== undefined ? input.site.trim() || null : renewal.site;
  const amount = calcAmountInr(plan, users, months, extraGb);

  await pool.execute(
    `UPDATE renewals SET
      plan = ?, users = ?, months = ?, extra_gb = ?, amount_inr = ?,
      trial_end_extend_to = ?, site = ?, updated_at = NOW()
     WHERE invoice_no = ?`,
    [plan, users, months, extraGb, amount, trialEndExtendTo, site, invoiceNo]
  );

  let updated = await getRenewalByInvoice(invoiceNo);
  if (!updated) throw new Error("Renewal not found after update");

  if (input.syncToSite) {
    const activation = await syncRenewalActivation(updated);
    updated = activation.renewal;
    return { renewal: updated, activation: activation.activation };
  }

  return { renewal: updated };
}

export async function syncRenewalActivation(invoiceNoOrRow: string | RenewalRow): Promise<{
  renewal: RenewalRow;
  activation: { ok: boolean; note: string };
}> {
  const renewal =
    typeof invoiceNoOrRow === "string"
      ? await getRenewalByInvoice(invoiceNoOrRow)
      : invoiceNoOrRow;
  if (!renewal) throw new Error("Renewal not found");

  const activation = await callActivationWebhook(renewal);
  const activationStatus = activation.ok
    ? "webhook_ok"
    : renewal.site
      ? "webhook_failed"
      : "manual";

  await pool.execute(
    `UPDATE renewals SET
      activation_status = ?,
      activation_note = ?,
      activated_at = COALESCE(activated_at, NOW()),
      updated_at = NOW()
     WHERE invoice_no = ?`,
    [activationStatus, activation.note, renewal.invoice_no]
  );

  const updated = await getRenewalByInvoice(renewal.invoice_no);
  if (!updated) throw new Error("Renewal not found after sync");
  return { renewal: updated, activation };
}

export async function markRenewalPaid(invoiceNo: string): Promise<{
  renewal: RenewalRow;
  activation: { ok: boolean; note: string };
}> {
  const renewal = await getRenewalByInvoice(invoiceNo);
  if (!renewal) throw new Error("Renewal not found");
  if (renewal.status === "paid") {
    return {
      renewal,
      activation: {
        ok: renewal.activation_status === "webhook_ok",
        note:
          formatActivationNoteForDisplay(renewal.activation_note) ?? "Already marked paid",
      },
    };
  }

  const activation = await callActivationWebhook(renewal);
  const activationStatus = activation.ok
    ? "webhook_ok"
    : renewal.site
      ? "webhook_failed"
      : "manual";

  await pool.execute(
    `UPDATE renewals SET
      status = 'paid',
      paid_at = NOW(),
      activated_at = NOW(),
      activation_status = ?,
      activation_note = ?
     WHERE invoice_no = ?`,
    [activationStatus, activation.note, invoiceNo]
  );

  const updated = await getRenewalByInvoice(invoiceNo);
  if (!updated) throw new Error("Renewal not found after paid");
  return { renewal: updated, activation };
}

export async function markRenewalManualActivation(invoiceNo: string): Promise<RenewalRow> {
  const renewal = await getRenewalByInvoice(invoiceNo);
  if (!renewal) throw new Error("Renewal not found");

  const folder = INSTANCE_FOLDERS[renewal.instance ?? ""] ?? renewal.instance ?? "VPS folder";
  const extend = renewal.trial_end_extend_to?.slice(0, 10) ?? "—";
  const note = `Manually activated on ${folder}. COMPANY_TRIAL_END=${extend}`;

  await pool.execute(
    `UPDATE renewals SET
      activation_status = 'manual',
      activation_note = ?,
      activated_at = COALESCE(activated_at, NOW()),
      updated_at = NOW()
     WHERE invoice_no = ?`,
    [note, invoiceNo]
  );

  const updated = await getRenewalByInvoice(invoiceNo);
  if (!updated) throw new Error("Renewal not found after manual activation");
  return updated;
}

export function serializeRenewal(row: RenewalRow) {
  const taxableInr = calcTaxableInr(row.plan, row.users, row.months, row.extra_gb);
  const grandTotalInr = calcGrandTotalInr(row.plan, row.users, row.months, row.extra_gb);
  const stored = Number(row.amount_inr);
  const amountInr =
    TEST_FLAT_BILL_INR > 0
      ? TEST_FLAT_BILL_INR
      : Math.abs(stored - grandTotalInr) < 0.02
        ? stored
        : Math.abs(stored - taxableInr) < 0.02
          ? grandTotalInr
          : stored;

  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    instance: row.instance,
    site: row.site,
    company: row.company,
    email: row.email,
    phone: row.phone,
    users: row.users,
    plan: row.plan,
    months: row.months,
    extraGb: row.extra_gb,
    amountInr,
    taxableInr,
    grandTotalInr,
    trialEnd: row.trial_end,
    billingAddress: row.billing_address,
    gstin: row.gstin,
    contactPerson: row.contact_person,
    buyerState: row.buyer_state,
    buyerStateCode: row.buyer_state_code,
    source: row.source,
    status: row.status,
    utr: row.utr,
    screenshotPath: row.screenshot_path,
    paidAt: row.paid_at,
    activatedAt: row.activated_at,
    activationStatus: row.activation_status,
    activationNote: formatActivationNoteForDisplay(row.activation_note),
    trialEndExtendTo: row.trial_end_extend_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vpsFolder: row.instance ? INSTANCE_FOLDERS[row.instance] ?? null : null,
  };
}
