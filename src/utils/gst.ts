import {
  EXTRA_STORAGE_PRICE_PER_GB,
  PLANS,
  type PlanId,
} from "../constants/pricing";

export const GST_RATE = 0.18;
export const CGST_RATE = 0.09;
export const SGST_RATE = 0.09;
export const DEFAULT_SAC = "998314"; // IT design and development / SaaS-style services

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcTaxableInr(
  plan: PlanId,
  users: number,
  months: number,
  extraGb: number
): number {
  const u = Math.max(1, Math.floor(users));
  const m = Math.max(1, Math.floor(months));
  const g = Math.max(0, Math.floor(extraGb));
  return PLANS[plan].pricePerUser * u * m + g * EXTRA_STORAGE_PRICE_PER_GB * m;
}

export function calcGstBreakdown(taxable: number) {
  const cgst = round2(taxable * CGST_RATE);
  const sgst = round2(taxable * SGST_RATE);
  const totalTax = round2(cgst + sgst);
  const grandTotal = round2(taxable + totalTax);
  return { taxable: round2(taxable), cgst, sgst, totalTax, grandTotal };
}

export function buildInvoiceLines(plan: PlanId, users: number, months: number, extraGb: number) {
  const u = Math.max(1, Math.floor(users));
  const m = Math.max(1, Math.floor(months));
  const g = Math.max(0, Math.floor(extraGb));
  const planLine = {
    particulars: `Kalpanik ${PLANS[plan].name} Subscription (${m} month${m > 1 ? "s" : ""})`,
    hsn: DEFAULT_SAC,
    qty: u,
    unit: "User",
    rate: PLANS[plan].pricePerUser * m,
    amount: PLANS[plan].pricePerUser * u * m,
  };
  const lines = [planLine];
  if (g > 0) {
    lines.push({
      particulars: `Extra Storage (${m} month${m > 1 ? "s" : ""})`,
      hsn: DEFAULT_SAC,
      qty: g,
      unit: "GB",
      rate: EXTRA_STORAGE_PRICE_PER_GB * m,
      amount: EXTRA_STORAGE_PRICE_PER_GB * g * m,
    });
  }
  return lines;
}
