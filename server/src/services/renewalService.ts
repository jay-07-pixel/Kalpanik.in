import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db/pool.js";
import {
  calcAmountInr,
  calcGrandTotalInr,
  calcTaxableInr,
  extendTrialEnd,
  isPlanId,
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

async function callActivationWebhook(renewal: RenewalRow): Promise<{
  ok: boolean;
  note: string;
}> {
  const site = renewal.site?.replace(/\/$/, "");
  if (!site) {
    return {
      ok: false,
      note: `No site URL. Manually update COMPANY_TRIAL_END on VPS folder: ${
        INSTANCE_FOLDERS[renewal.instance ?? ""] ?? "(unknown)"
      } → ${renewal.trial_end_extend_to}`,
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
        paidAt: new Date().toISOString(),
        amountInr: Number(renewal.amount_inr),
        trialEndExtendTo: renewal.trial_end_extend_to,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        note: `Webhook ${res.status}: ${text.slice(0, 200)}. Manual: set COMPANY_TRIAL_END=${renewal.trial_end_extend_to} on ${INSTANCE_FOLDERS[renewal.instance ?? ""] ?? renewal.instance}`,
      };
    }

    return { ok: true, note: `Webhook activated via ${url}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Webhook failed";
    return {
      ok: false,
      note: `${msg}. Manual: update COMPANY_TRIAL_END to ${renewal.trial_end_extend_to} in VPS folder ${INSTANCE_FOLDERS[renewal.instance ?? ""] ?? "(check instance mapping)"}`,
    };
  }
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
        note: renewal.activation_note ?? "Already marked paid",
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

export function serializeRenewal(row: RenewalRow) {
  const taxableInr = calcTaxableInr(row.plan, row.users, row.months, row.extra_gb);
  const grandTotalInr = calcGrandTotalInr(row.plan, row.users, row.months, row.extra_gb);
  const stored = Number(row.amount_inr);
  // Legacy rows stored pre-GST taxable; display/charge amount matches invoice grand total.
  const amountInr =
    Math.abs(stored - grandTotalInr) < 0.02
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
    activationNote: row.activation_note,
    trialEndExtendTo: row.trial_end_extend_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vpsFolder: row.instance ? INSTANCE_FOLDERS[row.instance] ?? null : null,
  };
}
