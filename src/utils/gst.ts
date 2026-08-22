import {
  EXTRA_STORAGE_LIST_PRICE_PER_GB,
  EXTRA_STORAGE_PRICE_PER_GB,
  PLANS,
  SPECIAL_DISCOUNT_PERCENT,
  TEST_FLAT_BILL_INR,
  type PlanId,
} from "../constants/pricing";

export const GST_RATE = 0.18;
export const CGST_RATE = 0.09;
export const SGST_RATE = 0.09;
export const DEFAULT_SAC = "998314"; // IT design and development / SaaS-style services

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function panFromGstin(gstin?: string | null): string {
  const g = (gstin || "").replace(/\s/g, "").toUpperCase();
  return g.length >= 12 ? g.slice(2, 12) : "";
}

export function calcTaxableInr(
  plan: PlanId,
  users: number,
  months: number,
  extraGb: number
): number {
  if (TEST_FLAT_BILL_INR > 0) return TEST_FLAT_BILL_INR;
  const u = Math.max(1, Math.floor(users));
  const m = Math.max(1, Math.floor(months));
  const g = Math.max(0, Math.floor(extraGb));
  return PLANS[plan].pricePerUser * u * m + g * EXTRA_STORAGE_PRICE_PER_GB * m;
}

export function calcListInr(
  plan: PlanId,
  users: number,
  months: number,
  extraGb: number
): number {
  const u = Math.max(1, Math.floor(users));
  const m = Math.max(1, Math.floor(months));
  const g = Math.max(0, Math.floor(extraGb));
  return PLANS[plan].listPricePerUser * u * m + g * EXTRA_STORAGE_LIST_PRICE_PER_GB * m;
}

export function calcGstBreakdown(taxable: number) {
  if (TEST_FLAT_BILL_INR > 0) {
    return {
      taxable: TEST_FLAT_BILL_INR,
      cgst: 0,
      sgst: 0,
      totalTax: 0,
      grandTotal: TEST_FLAT_BILL_INR,
    };
  }
  const cgst = round2(taxable * CGST_RATE);
  const sgst = round2(taxable * SGST_RATE);
  const totalTax = round2(cgst + sgst);
  const grandTotal = round2(taxable + totalTax);
  return { taxable: round2(taxable), cgst, sgst, totalTax, grandTotal };
}

export interface InvoiceLineItem {
  subscription: string;
  description: string;
  interval: string;
  qty: number;
  amount: number;
  hsn?: string;
}

export function buildInvoiceLines(
  plan: PlanId,
  users: number,
  months: number,
  extraGb: number,
  intervalLabel?: string
): InvoiceLineItem[] {
  const u = Math.max(1, Math.floor(users));
  const m = Math.max(1, Math.floor(months));
  const g = Math.max(0, Math.floor(extraGb));
  const interval = intervalLabel || `${m} month${m > 1 ? "s" : ""}`;

  if (TEST_FLAT_BILL_INR > 0) {
    return [
      {
        subscription: `Kalpanik ${PLANS[plan].name}`,
        description: "Subscription (test billing)",
        interval,
        qty: u,
        amount: TEST_FLAT_BILL_INR,
        hsn: DEFAULT_SAC,
      },
    ];
  }

  const listPlan = PLANS[plan].listPricePerUser * u * m;
  const netPlan = PLANS[plan].pricePerUser * u * m;
  const planDiscount = listPlan - netPlan;

  const lines: InvoiceLineItem[] = [
    {
      subscription: `Kalpanik ${PLANS[plan].name}`,
      description: "Subscription",
      interval,
      qty: u,
      amount: listPlan,
      hsn: DEFAULT_SAC,
    },
    {
      subscription: `Special Customer Discount ${SPECIAL_DISCOUNT_PERCENT}%`,
      description: "Lucky customer offer",
      interval: "",
      qty: 0,
      amount: -planDiscount,
    },
  ];

  if (g > 0) {
    const listStorage = EXTRA_STORAGE_LIST_PRICE_PER_GB * g * m;
    const netStorage = EXTRA_STORAGE_PRICE_PER_GB * g * m;
    lines.push({
      subscription: "Extra Storage",
      description: "Add-on",
      interval,
      qty: g,
      amount: listStorage,
      hsn: DEFAULT_SAC,
    });
    lines.push({
      subscription: `Storage Discount ${SPECIAL_DISCOUNT_PERCENT}%`,
      description: "Lucky customer offer",
      interval: "",
      qty: 0,
      amount: -(listStorage - netStorage),
    });
  }

  return lines;
}
