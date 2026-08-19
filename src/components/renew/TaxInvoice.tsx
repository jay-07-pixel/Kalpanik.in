import { BRAND, PLANS, SPECIAL_DISCOUNT_PERCENT, type PlanId } from "../../constants/pricing";
import { DEFAULT_SAC, panFromGstin, type InvoiceLineItem } from "../../utils/gst";

export interface GstBreakdown {
  taxable: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  grandTotal: number;
}

export interface SellerInfo {
  legalName: string;
  brandName?: string;
  address: string;
  gstin: string;
  email: string;
  phone: string;
  stateName?: string;
  stateCode?: string;
  udyam?: string;
  pan?: string;
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
  accountType?: string;
  ifsc?: string;
  jurisdiction?: string;
}

export interface TaxInvoiceProps {
  invoiceNo: string;
  dated: Date;
  seller: SellerInfo;
  buyer: {
    company: string;
    address?: string | null;
    gstin?: string | null;
    pan?: string | null;
    email?: string | null;
    phone?: string | null;
    contactPerson?: string | null;
    stateName?: string | null;
    stateCode?: string | null;
  };
  reference?: {
    instance?: string | null;
    site?: string | null;
    trialEnd?: string | null;
    extendTo?: string | null;
    plan?: PlanId | null;
    months?: number | null;
  };
  lines: InvoiceLineItem[];
  gst: GstBreakdown;
  remarks?: string;
  paymentQrUrl?: string | null;
  onPrint?: () => void;
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="gi-meta-row">
      <span className="gi-meta-label">{label}</span>
      <span className="gi-meta-dots" aria-hidden="true" />
      <span className="gi-meta-value">{value}</span>
    </div>
  );
}

function MoneySummary({
  title,
  gst,
  useIgst,
}: {
  title: string;
  gst: GstBreakdown;
  useIgst: boolean;
}) {
  return (
    <div className="gi-summary">
      {title ? <h3>{title}</h3> : null}
      <div className="gi-summary-row">
        <span>Subtotal in INR</span>
        <strong>₹{fmt(gst.taxable)}</strong>
      </div>
      {useIgst ? (
        <div className="gi-summary-row">
          <span>Integrated GST (18%)</span>
          <strong>₹{fmt(gst.totalTax)}</strong>
        </div>
      ) : (
        <>
          <div className="gi-summary-row">
            <span>Central GST (9%)</span>
            <strong>₹{fmt(gst.cgst)}</strong>
          </div>
          <div className="gi-summary-row">
            <span>State GST (9%)</span>
            <strong>₹{fmt(gst.sgst)}</strong>
          </div>
        </>
      )}
      <div className="gi-summary-row gi-summary-total">
        <span>Total in INR</span>
        <strong>₹{fmt(gst.grandTotal)}</strong>
      </div>
    </div>
  );
}

export function TaxInvoice({
  invoiceNo,
  dated,
  seller,
  buyer,
  reference,
  lines,
  gst,
  remarks,
  paymentQrUrl,
  onPrint,
}: TaxInvoiceProps) {
  const placeOfSupply = buyer.stateName || buyer.stateCode || seller.stateName || "—";
  const placeCode = buyer.stateCode || seller.stateCode || "";
  const sellerPan = seller.pan || panFromGstin(seller.gstin);
  const buyerPan = buyer.pan || panFromGstin(buyer.gstin);
  const planName = reference?.plan ? PLANS[reference.plan].name : "Subscription";
  const months = reference?.months ?? 1;
  const summaryTitle =
    reference?.trialEnd && reference?.extendTo
      ? `Summary for ${reference.trialEnd} – ${reference.extendTo}`
      : `Summary for ${months} month${months > 1 ? "s" : ""}`;
  const useIgst = Boolean(
    seller.stateCode && buyer.stateCode && seller.stateCode !== buyer.stateCode
  );
  const productLabel = `Kalpanik ${planName}`;
  const hsn = lines.find((l) => l.hsn)?.hsn || DEFAULT_SAC;

  return (
    <article className="gi-invoice" id="invoice-print">
      {/* —— Page 1 style overview —— */}
      <section className="gi-page">
        <header className="gi-header">
          <div className="gi-header-left">
            <img src="/kalpanik-wordmark.png?v=3" alt="Kalpanik" className="gi-logo" />
            <h1>Invoice</h1>
            <p className="gi-invoice-no">Invoice number: {invoiceNo}</p>
          </div>
          <div className="gi-header-right">
            {paymentQrUrl ? (
              <img src={paymentQrUrl} alt="UPI payment QR" className="gi-qr" />
            ) : (
              <div className="gi-qr gi-qr--placeholder" aria-hidden="true" />
            )}
          </div>
        </header>

        <div className="gi-parties">
          <div className="gi-bill-to">
            <h2>Bill to</h2>
            {buyer.contactPerson && <p className="gi-strong">{buyer.contactPerson}</p>}
            <p className="gi-strong">{buyer.company}</p>
            {buyer.address && <p className="gi-muted">{buyer.address}</p>}
            <p className="gi-muted">India</p>
            {buyer.gstin && <p>GSTIN: {buyer.gstin}</p>}
            {buyerPan && <p>PAN: {buyerPan}</p>}
            <p>
              Place of Supply/State Code: {placeOfSupply}
              {placeCode ? ` / ${placeCode}` : ""}
            </p>
            {buyer.email && <p className="gi-muted">{buyer.email}</p>}
            {buyer.phone && <p className="gi-muted">{buyer.phone}</p>}
          </div>

          <div className="gi-seller">
            <h2>{seller.legalName}</h2>
            {seller.brandName && <p className="gi-muted">Brand: {seller.brandName}</p>}
            <p className="gi-muted">{seller.address}</p>
            {(seller.stateName || seller.stateCode) && (
              <p className="gi-muted">
                {seller.stateName || ""}
                {seller.stateCode ? ` ${seller.stateCode}` : ""}
              </p>
            )}
            <p className="gi-muted">India</p>
            {seller.gstin && <p>GSTIN: {seller.gstin}</p>}
            {sellerPan && <p>PAN: {sellerPan}</p>}
            {seller.udyam && <p>UDYAM: {seller.udyam}</p>}
            {seller.email && <p className="gi-muted">{seller.email}</p>}
            {seller.phone && <p className="gi-muted">{seller.phone}</p>}
          </div>
        </div>

        <div className="gi-details">
          <div className="gi-details-meta">
            <h3>Details</h3>
            <MetaRow label="Invoice number" value={invoiceNo} />
            <MetaRow label="Invoice date" value={fmtDate(dated)} />
            <MetaRow label="Billing ID" value={reference?.instance || "—"} />
            <MetaRow
              label="Domain / site"
              value={reference?.site || BRAND.website.replace(/^https?:\/\//, "")}
            />
          </div>
          <div className="gi-details-amount">
            <p className="gi-hsn">HSN: {hsn}</p>
            <p className="gi-product">{productLabel}</p>
            <p className="gi-big-total">₹{fmt(gst.grandTotal)}</p>
            <p className="gi-total-label">Total in INR</p>
          </div>
        </div>

        <MoneySummary title={summaryTitle} gst={gst} useIgst={useIgst} />

        <p className="gi-legal-note">
          Tax should not be deducted on the GST component charged on the invoice as per the
          applicable provisions of the Income Tax Act.
          <br />
          <span>
            Note: Unless otherwise stated, tax on this invoice is not payable under reverse charge.
            Supplies under reverse charge are to be mentioned separately.
          </span>
        </p>

        <p className="gi-page-no">Page 1 of 2</p>
      </section>

      {/* —— Page 2 style line items —— */}
      <section className="gi-page gi-page--break">
        <header className="gi-header gi-header--compact">
          <div className="gi-header-left">
            <img src="/kalpanik-wordmark.png?v=3" alt="Kalpanik" className="gi-logo" />
            <h1>Invoice</h1>
          </div>
          <p className="gi-invoice-no">Invoice number: {invoiceNo}</p>
        </header>

        <table className="gi-lines">
          <thead>
            <tr>
              <th>Subscription</th>
              <th>Description</th>
              <th>Interval</th>
              <th className="num">Quantity</th>
              <th className="num">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={`${line.subscription}-${i}`} className={line.amount < 0 ? "gi-discount" : undefined}>
                <td>{line.subscription}</td>
                <td>{line.description}</td>
                <td>{line.interval}</td>
                <td className="num">{line.qty > 0 ? line.qty : ""}</td>
                <td className="num">{fmt(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <MoneySummary title="" gst={gst} useIgst={useIgst} />

        <div className="gi-help">
          <p>
            <strong>{SPECIAL_DISCOUNT_PERCENT}% OFF</strong> — Special offer for our lucky
            customers. Need help with this invoice?{" "}
            <a href={`mailto:${seller.email || BRAND.supportEmail}`}>
              Contact {seller.email || BRAND.supportEmail}
            </a>
          </p>
          {remarks && <p className="gi-help-remarks">{remarks}</p>}
        </div>

        <div className="gi-bottom-grid">
          {(seller.bankName || seller.accountNumber) && (
            <div className="gi-bank">
              <h3>Company&apos;s Bank Details</h3>
              <p>
                <span>Bank Name</span>
                <strong>
                  {seller.bankName}
                  {seller.accountType ? ` (${seller.accountType})` : ""}
                </strong>
              </p>
              <p>
                <span>A/c Name</span>
                <strong>{seller.accountName}</strong>
              </p>
              <p>
                <span>A/c No.</span>
                <strong>{seller.accountNumber}</strong>
              </p>
              <p>
                <span>Branch &amp; IFSC</span>
                <strong>
                  {seller.bankBranch} &amp; {seller.ifsc}
                </strong>
              </p>
            </div>
          )}

          <div className="gi-seal-block">
            <p>for {seller.legalName}</p>
            <img
              src="/seal-signature.png"
              alt={`${seller.legalName} seal & authorised signatory`}
              className="gi-seal-img"
            />
            <p className="gi-seal-label">Authorised Signatory</p>
          </div>
        </div>

        {sellerPan && (
          <div className="gi-declaration">
            <p>Company&apos;s PAN : <strong>{sellerPan}</strong></p>
            <p className="gi-declare-heading">Declaration</p>
            <p>
              We declare that this invoice shows the actual price of the goods/services described
              and that all particulars are true and correct.
            </p>
          </div>
        )}

        <p className="gi-jurisdiction">
          SUBJECT TO {(seller.jurisdiction || seller.stateName || "INDIA").toUpperCase()} JURISDICTION
        </p>
        <p className="gi-computer">This is a Computer Generated Invoice</p>
        <p className="gi-page-no">Page 2 of 2</p>
      </section>

      {onPrint && (
        <button type="button" className="mkt-btn mkt-btn--ghost no-print gi-print-btn" onClick={onPrint}>
          Print / Save PDF
        </button>
      )}
    </article>
  );
}
