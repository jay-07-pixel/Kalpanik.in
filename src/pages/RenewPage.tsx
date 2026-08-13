import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { SiteNav } from "../components/marketing/SiteNav";
import { SiteFooter } from "../components/marketing/PricingCards";
import { TaxInvoice } from "../components/renew/TaxInvoice";
import {
  BRAND,
  EXTRA_STORAGE_LIST_PRICE_PER_GB,
  EXTRA_STORAGE_PRICE_PER_GB,
  PLANS,
  SPECIAL_DISCOUNT_PERCENT,
  isPlanId,
  storageIncludedGb,
  type PlanId,
} from "../constants/pricing";
import { buildInvoiceLines, calcGstBreakdown, calcListInr, calcTaxableInr } from "../utils/gst";
import { API_BASE } from "../constants/admin";
import "../marketing.css";

interface RenewalData {
  invoiceNo: string;
  company: string;
  email: string;
  phone: string | null;
  users: number;
  plan: PlanId;
  months: number;
  extraGb: number;
  amountInr: number;
  instance: string | null;
  site: string | null;
  trialEnd: string | null;
  trialEndExtendTo: string | null;
  billingAddress: string | null;
  gstin: string | null;
  contactPerson?: string | null;
  buyerState?: string | null;
  buyerStateCode?: string | null;
  status: string;
  utr: string | null;
}

interface InvoiceCompany {
  legalName: string;
  brandName?: string;
  address: string;
  gstin: string;
  email: string;
  phone: string;
  stateName?: string;
  stateCode?: string;
  udyam?: string;
  jurisdiction?: string;
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
  accountType?: string;
  ifsc?: string;
}

function renewalsApi(path: string) {
  return `${API_BASE}/api/renewals${path}`;
}

export function RenewPage() {
  const [params] = useSearchParams();

  const [company, setCompany] = useState(params.get("company") ?? "");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [phone, setPhone] = useState(params.get("phone") ?? "");
  const [contactPerson, setContactPerson] = useState(params.get("contact") ?? "");
  const [users, setUsers] = useState(Number(params.get("users")) || 5);
  const [months, setMonths] = useState(Number(params.get("months")) || 1);
  const [extraGb, setExtraGb] = useState(Number(params.get("extraGb")) || 0);
  const [plan, setPlan] = useState<PlanId>(
    isPlanId(params.get("plan") ?? "") ? (params.get("plan") as PlanId) : "task_attendance"
  );
  const [billingAddress, setBillingAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [buyerState, setBuyerState] = useState("");
  const [buyerStateCode, setBuyerStateCode] = useState("");
  const [trialEnd] = useState(params.get("trialEnd") ?? "");
  const [instance] = useState(params.get("instance") ?? "");
  const [site] = useState(params.get("site") ?? "");
  const [source] = useState(params.get("source") ?? "website");

  const [step, setStep] = useState<"form" | "pay" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [renewal, setRenewal] = useState<RenewalData | null>(null);
  const [upiUri, setUpiUri] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [invoiceCompany, setInvoiceCompany] = useState<InvoiceCompany | null>(null);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const taxable = useMemo(
    () => calcTaxableInr(plan, users, months, extraGb),
    [plan, users, months, extraGb]
  );
  const listTotal = useMemo(
    () => calcListInr(plan, users, months, extraGb),
    [plan, users, months, extraGb]
  );
  const gst = useMemo(() => calcGstBreakdown(taxable), [taxable]);
  const discountInr = listTotal - taxable;

  useEffect(() => {
    fetch(renewalsApi("/config"))
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUpiId(data.data.upiId);
          setInvoiceCompany(data.data.company);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!upiUri) return;
    QRCode.toDataURL(upiUri, { width: 280, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [upiUri]);

  const createInvoice = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(renewalsApi("/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          email,
          phone,
          contactPerson,
          users,
          months,
          extraGb,
          plan,
          billingAddress,
          gstin,
          buyerState,
          buyerStateCode,
          trialEnd: trialEnd || undefined,
          instance: instance || undefined,
          site: site || undefined,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? "Failed to create invoice.");
        return;
      }
      setRenewal(data.data);
      setUpiUri(data.payment.upiUri);
      setUpiId(data.payment.upiId);
      setStep("pay");
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitProof = async (e: FormEvent) => {
    e.preventDefault();
    if (!renewal) return;
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("utr", utr);
      if (screenshot) form.append("screenshot", screenshot);

      const res = await fetch(renewalsApi(`/${renewal.invoiceNo}/proof`), {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? "Failed to submit payment proof.");
        return;
      }
      setRenewal(data.data);
      setStep("done");
    } catch {
      setError("Unable to submit proof. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = () => window.print();

  const seller: InvoiceCompany = invoiceCompany ?? {
    legalName: "SHREE S2N SOLUTIONS",
    brandName: "Kalpanik",
    address: "ANANDAM WORLD CITY",
    gstin: "",
    email: "support@kalpanik.in",
    phone: "",
  };

  return (
    <div className="mkt-shell">
      <div className="no-print">
        <SiteNav />
      </div>

      <section className="mkt-hero mkt-hero--compact no-print">
        <div className="mkt-hero-bg" />
        <h1>Renew Subscription</h1>
        <p className="mkt-hero-sub">
          Generate a tax invoice, pay via UPI QR / bank transfer, and submit UTR for activation.
        </p>
        {instance && (
          <p className="mkt-renew-meta">
            Instance <strong>{instance}</strong>
            {site ? (
              <>
                {" "}
                · <a href={site}>{site}</a>
              </>
            ) : null}
          </p>
        )}
      </section>

      <section className="mkt-section renew-section">
        {error && <p className="renew-error no-print">{error}</p>}

        {step === "form" && (
          <form className="renew-form no-print" onSubmit={createInvoice}>
            <div className="renew-grid">
              <label>
                Company
                <input value={company} onChange={(e) => setCompany(e.target.value)} required />
              </label>
              <label>
                Contact person
                <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Phone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Users
                <input
                  type="number"
                  min={1}
                  value={users}
                  onChange={(e) => setUsers(Number(e.target.value) || 1)}
                  required
                />
              </label>
              <label>
                Months
                <input
                  type="number"
                  min={1}
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value) || 1)}
                  required
                />
              </label>
              <label>
                Extra storage (GB)
                <input
                  type="number"
                  min={0}
                  value={extraGb}
                  onChange={(e) => setExtraGb(Number(e.target.value) || 0)}
                />
              </label>
              <label>
                Plan
                <select value={plan} onChange={(e) => setPlan(e.target.value as PlanId)}>
                  <option value="task_management">
                    Task Management — ₹{PLANS.task_management.pricePerUser}/user/mo (
                    {SPECIAL_DISCOUNT_PERCENT}% off)
                  </option>
                  <option value="task_attendance">
                    Task + Attendance — ₹{PLANS.task_attendance.pricePerUser}/user/mo (
                    {SPECIAL_DISCOUNT_PERCENT}% off)
                  </option>
                </select>
              </label>
              <label>
                Buyer GSTIN (optional)
                <input value={gstin} onChange={(e) => setGstin(e.target.value)} />
              </label>
              <label>
                State name
                <input
                  value={buyerState}
                  onChange={(e) => setBuyerState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                />
              </label>
              <label>
                State code
                <input
                  value={buyerStateCode}
                  onChange={(e) => setBuyerStateCode(e.target.value)}
                  placeholder="e.g. 27"
                />
              </label>
              <label className="renew-full">
                Billing address
                <textarea
                  rows={3}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                />
              </label>
            </div>

            <aside className="renew-summary">
              <h3>Bill summary</h3>
              <p className="renew-offer-banner">{BRAND.specialOffer}</p>
              <p>
                {PLANS[plan].name}: <s>₹{PLANS[plan].listPricePerUser}</s> ₹
                {PLANS[plan].pricePerUser} × {users} users × {months} mo
              </p>
              <p>Included storage: {storageIncludedGb(users)} GB</p>
              {extraGb > 0 && (
                <p>
                  Extra storage: <s>₹{EXTRA_STORAGE_LIST_PRICE_PER_GB}</s> ₹
                  {EXTRA_STORAGE_PRICE_PER_GB} × {extraGb} GB × {months} mo
                </p>
              )}
              <p>
                List total: <s>₹{listTotal.toLocaleString("en-IN")}</s>
              </p>
              <p className="renew-discount">
                Special discount ({SPECIAL_DISCOUNT_PERCENT}%): −₹
                {discountInr.toLocaleString("en-IN")}
              </p>
              <p>Taxable: ₹{gst.taxable.toLocaleString("en-IN")}</p>
              <p>CGST 9%: ₹{gst.cgst.toLocaleString("en-IN")}</p>
              <p>SGST 9%: ₹{gst.sgst.toLocaleString("en-IN")}</p>
              <p className="renew-total">
                Grand total: ₹{gst.grandTotal.toLocaleString("en-IN")}
              </p>
              <button className="mkt-btn mkt-btn--primary" type="submit" disabled={loading}>
                {loading ? "Creating invoice…" : "Generate Tax Invoice & Pay"}
              </button>
            </aside>
          </form>
        )}

        {(step === "pay" || step === "done") && renewal && (
          <div className="renew-pay-layout">
            <TaxInvoice
              invoiceNo={renewal.invoiceNo}
              dated={new Date()}
              seller={seller}
              buyer={{
                company: renewal.company,
                address: renewal.billingAddress,
                gstin: renewal.gstin,
                email: renewal.email,
                phone: renewal.phone,
                contactPerson: renewal.contactPerson ?? contactPerson,
                stateName: renewal.buyerState ?? buyerState,
                stateCode: renewal.buyerStateCode ?? buyerStateCode,
              }}
              reference={{
                instance: renewal.instance,
                site: renewal.site,
                trialEnd: renewal.trialEnd,
                extendTo: renewal.trialEndExtendTo,
                plan: renewal.plan,
              }}
              lines={buildInvoiceLines(
                renewal.plan,
                renewal.users,
                renewal.months,
                renewal.extraGb
              )}
              gst={calcGstBreakdown(
                calcTaxableInr(renewal.plan, renewal.users, renewal.months, renewal.extraGb)
              )}
              remarks={`${BRAND.specialOffer}. Invoice ${renewal.invoiceNo}. Pay via UPI/Bank and submit UTR.`}
              onPrint={printInvoice}
            />

            {step === "pay" && (
              <aside className="renew-upi no-print">
                <h3>Pay via UPI</h3>
                <p className="renew-upi-amount">
                  ₹{Number(renewal.amountInr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
                <p className="renew-upi-id">{upiId}</p>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="UPI QR code" className="renew-qr" />
                ) : (
                  <p>Generating QR…</p>
                )}
                <a className="mkt-btn mkt-btn--primary" href={upiUri}>
                  Open UPI App
                </a>
                <p className="renew-upi-hint">
                  Amount includes GST (18%). Scan QR, pay exact amount, then enter UTR below.
                  Invoice number is sent as payment remark.
                </p>

                <form className="renew-proof-form" onSubmit={submitProof}>
                  <label>
                    UTR / Transaction ID
                    <input value={utr} onChange={(e) => setUtr(e.target.value)} required />
                  </label>
                  <label>
                    Payment screenshot (optional)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <button className="mkt-btn mkt-btn--primary" type="submit" disabled={loading}>
                    {loading ? "Submitting…" : "Submit Payment Proof"}
                  </button>
                </form>
              </aside>
            )}

            {step === "done" && (
              <aside className="renew-done no-print">
                <h3>Payment submitted</h3>
                <p>
                  Status: <strong>Pending verification</strong>
                </p>
                <p>
                  We’ll activate your subscription after confirming UTR{" "}
                  <strong>{renewal.utr}</strong>.
                </p>
                {renewal.site && (
                  <p>
                    After activation, return to <a href={renewal.site}>{renewal.site}</a>
                  </p>
                )}
              </aside>
            )}
          </div>
        )}
      </section>

      <div className="no-print">
        <SiteFooter />
      </div>
    </div>
  );
}
