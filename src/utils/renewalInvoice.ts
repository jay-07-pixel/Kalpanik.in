import { BRAND, type PlanId } from "../constants/pricing";
import { buildInvoiceLines, calcGstBreakdown, calcTaxableInr } from "./gst";
import type { SellerInfo, TaxInvoiceProps } from "../components/renew/TaxInvoice";

export interface RenewalInvoiceData {
  invoiceNo: string;
  company: string;
  email: string;
  phone: string | null;
  users: number;
  plan: PlanId;
  months: number;
  extraGb: number;
  instance: string | null;
  site: string | null;
  trialEnd: string | null;
  trialEndExtendTo: string | null;
  billingAddress: string | null;
  gstin: string | null;
  contactPerson: string | null;
  buyerState: string | null;
  buyerStateCode: string | null;
  utr: string | null;
  createdAt: string;
}

export function buildTaxInvoiceProps(
  renewal: RenewalInvoiceData,
  seller: SellerInfo,
  options?: { allowPrint?: boolean; paymentQrUrl?: string | null }
): TaxInvoiceProps {
  const intervalLabel =
    renewal.trialEnd && renewal.trialEndExtendTo
      ? `${renewal.trialEnd} – ${renewal.trialEndExtendTo}`
      : undefined;
  const taxable = calcTaxableInr(renewal.plan, renewal.users, renewal.months, renewal.extraGb);
  const utrNote = renewal.utr ? ` UTR: ${renewal.utr}.` : "";

  return {
    invoiceNo: renewal.invoiceNo,
    dated: new Date(renewal.createdAt),
    seller,
    buyer: {
      company: renewal.company,
      address: renewal.billingAddress,
      gstin: renewal.gstin,
      email: renewal.email,
      phone: renewal.phone,
      contactPerson: renewal.contactPerson,
      stateName: renewal.buyerState,
      stateCode: renewal.buyerStateCode,
    },
    reference: {
      instance: renewal.instance,
      site: renewal.site,
      trialEnd: renewal.trialEnd,
      extendTo: renewal.trialEndExtendTo,
      plan: renewal.plan,
      months: renewal.months,
    },
    lines: buildInvoiceLines(
      renewal.plan,
      renewal.users,
      renewal.months,
      renewal.extraGb,
      intervalLabel
    ),
    gst: calcGstBreakdown(taxable),
    remarks: `${BRAND.specialOffer}. Invoice ${renewal.invoiceNo}.${utrNote}`,
    paymentQrUrl: options?.paymentQrUrl ?? null,
    allowPrint: options?.allowPrint ?? Boolean(renewal.utr),
  };
}
