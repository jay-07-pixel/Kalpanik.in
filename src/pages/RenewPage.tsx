import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { SiteNav } from "../components/marketing/SiteNav";
import { SiteFooter } from "../components/marketing/PricingCards";
import {
  EXTRA_STORAGE_PRICE_PER_GB,
  PLANS,
  calcAmountInr,
  isPlanId,
  storageIncludedGb,
  type PlanId,
} from "../constants/pricing";
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
  const [users, setUsers] = useState(Number(params.get("users")) || 5);
  const [months, setMonths] = useState(Number(params.get("months")) || 1);
  const [extraGb, setExtraGb] = useState(Number(params.get("extraGb")) || 0);
  const [plan, setPlan] = useState<PlanId>(
    isPlanId(params.get("plan") ?? "") ? (params.get("plan") as PlanId) : "task_attendance"
  );
  const [billingAddress, setBillingAddress] = useState("");
  const [gstin, setGstin] = useState("");
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

  const amount = useMemo(
    () => calcAmountInr(plan, users, months, extraGb),
    [plan, users, months, extraGb]
  );

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
          users,
          months,
          extraGb,
          plan,
          billingAddress,
          gstin,
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

  return (
    <div className="mkt-shell">
      <div className="no-print">
        <SiteNav />
      </div>

      <section className="mkt-hero mkt-hero--compact no-print">
        <div className="mkt-hero-bg" />
        <h1>Renew Subscription</h1>
        <p className="mkt-hero-sub">
          Generate your Kalpanik invoice, pay via UPI QR, and submit UTR for activation.
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
                    Task Management — ₹{PLANS.task_management.pricePerUser}/user/mo
                  </option>
                  <option value="task_attendance">
                    Task + Attendance — ₹{PLANS.task_attendance.pricePerUser}/user/mo
                  </option>
                </select>
              </label>
              <label>
                GSTIN (optional)
                <input value={gstin} onChange={(e) => setGstin(e.target.value)} />
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
              <p>
                {PLANS[plan].name}: ₹{PLANS[plan].pricePerUser} × {users} users × {months} mo
              </p>
              <p>
                Included storage: {storageIncludedGb(users)} GB
              </p>
              {extraGb > 0 && (
                <p>
                  Extra storage: ₹{EXTRA_STORAGE_PRICE_PER_GB} × {extraGb} GB × {months} mo
                </p>
              )}
              <p className="renew-total">Total: ₹{amount.toLocaleString("en-IN")}</p>
              <button className="mkt-btn mkt-btn--primary" type="submit" disabled={loading}>
                {loading ? "Creating invoice…" : "Generate Invoice & Pay"}
              </button>
            </aside>
          </form>
        )}

        {(step === "pay" || step === "done") && renewal && (
          <div className="renew-pay-layout">
            <article className="renew-invoice" id="invoice-print">
              <header className="renew-invoice-head">
                <div>
                  <img src="/kalpanik-wordmark.png?v=3" alt="Kalpanik" className="renew-invoice-logo" />
                  <p>
                    <strong>{invoiceCompany?.legalName ?? "SHREE S2N SOLUTIONS"}</strong>
                  </p>
                  {invoiceCompany?.brandName && <p>Brand: {invoiceCompany.brandName}</p>}
                  <p>{invoiceCompany?.address}</p>
                  {invoiceCompany?.gstin && <p>GSTIN: {invoiceCompany.gstin}</p>}
                  <p>{invoiceCompany?.email}</p>
                  {invoiceCompany?.phone && <p>{invoiceCompany.phone}</p>}
                </div>
                <div className="renew-invoice-meta">
                  <h2>TAX INVOICE</h2>
                  <p>
                    <strong>{renewal.invoiceNo}</strong>
                  </p>
                  <p>{new Date().toLocaleDateString("en-IN")}</p>
                </div>
              </header>

              <div className="renew-invoice-parties">
                <div>
                  <h4>Bill To</h4>
                  <p>
                    <strong>{renewal.company}</strong>
                  </p>
                  <p>{renewal.email}</p>
                  {renewal.phone && <p>{renewal.phone}</p>}
                  {renewal.billingAddress && <p>{renewal.billingAddress}</p>}
                  {renewal.gstin && <p>GSTIN: {renewal.gstin}</p>}
                </div>
                <div>
                  <h4>Reference</h4>
                  {renewal.instance && <p>Instance: {renewal.instance}</p>}
                  {renewal.site && <p>Site: {renewal.site}</p>}
                  {renewal.trialEnd && <p>Current trial end: {renewal.trialEnd}</p>}
                  {renewal.trialEndExtendTo && (
                    <p>Extend to: {renewal.trialEndExtendTo}</p>
                  )}
                </div>
              </div>

              <table className="renew-invoice-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {PLANS[renewal.plan].name} ({renewal.months} month
                      {renewal.months > 1 ? "s" : ""})
                    </td>
                    <td>{renewal.users}</td>
                    <td>₹{PLANS[renewal.plan].pricePerUser}</td>
                    <td>
                      ₹
                      {(
                        PLANS[renewal.plan].pricePerUser *
                        renewal.users *
                        renewal.months
                      ).toLocaleString("en-IN")}
                    </td>
                  </tr>
                  {renewal.extraGb > 0 && (
                    <tr>
                      <td>Extra storage ({renewal.months} month{renewal.months > 1 ? "s" : ""})</td>
                      <td>{renewal.extraGb} GB</td>
                      <td>₹{EXTRA_STORAGE_PRICE_PER_GB}</td>
                      <td>
                        ₹
                        {(
                          renewal.extraGb *
                          EXTRA_STORAGE_PRICE_PER_GB *
                          renewal.months
                        ).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="renew-invoice-total">
                Total payable: ₹{renewal.amountInr.toLocaleString("en-IN")}
              </p>

              {(invoiceCompany?.accountNumber || invoiceCompany?.ifsc) && (
                <div className="renew-bank-box">
                  <h4>Bank transfer details</h4>
                  <p>
                    <strong>Account name:</strong> {invoiceCompany?.accountName}
                  </p>
                  <p>
                    <strong>Bank:</strong> {invoiceCompany?.bankName}
                    {invoiceCompany?.bankBranch ? ` — ${invoiceCompany.bankBranch}` : ""}
                  </p>
                  <p>
                    <strong>Account type:</strong> {invoiceCompany?.accountType}
                  </p>
                  <p>
                    <strong>Account number:</strong> {invoiceCompany?.accountNumber}
                  </p>
                  <p>
                    <strong>IFSC:</strong> {invoiceCompany?.ifsc}
                  </p>
                  <p className="muted">
                    Prefer UPI QR on the right for faster payment. Use bank transfer if needed,
                    then submit UTR below.
                  </p>
                </div>
              )}

              <button type="button" className="mkt-btn mkt-btn--ghost no-print" onClick={printInvoice}>
                Print / Save PDF
              </button>
            </article>

            {step === "pay" && (
              <aside className="renew-upi no-print">
                <h3>Pay via UPI</h3>
                <p className="renew-upi-amount">
                  ₹{renewal.amountInr.toLocaleString("en-IN")}
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
                  Scan the QR or open your UPI app, pay the exact amount, then enter UTR below.
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
                    After activation, return to{" "}
                    <a href={renewal.site}>{renewal.site}</a>
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
