import { amountInWordsInr } from "../../utils/amountInWords";
import { DEFAULT_SAC } from "../../utils/gst";
import { PLANS, type PlanId } from "../../constants/pricing";

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
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
  accountType?: string;
  ifsc?: string;
  jurisdiction?: string;
}

export interface InvoiceLine {
  particulars: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface TaxInvoiceProps {
  invoiceNo: string;
  dated: Date;
  seller: SellerInfo;
  buyer: {
    company: string;
    address?: string | null;
    gstin?: string | null;
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
  };
  lines: InvoiceLine[];
  gst: GstBreakdown;
  remarks?: string;
  onPrint?: () => void;
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  onPrint,
}: TaxInvoiceProps) {
  const placeOfSupply = buyer.stateName || seller.stateName || "—";

  return (
    <article className="tax-invoice" id="invoice-print">
      <div className="tax-invoice-title">Tax Invoice</div>

      <div className="tax-invoice-top">
        <div className="tax-invoice-seller">
          <img src="/kalpanik-wordmark.png?v=3" alt="Kalpanik" className="tax-invoice-logo" />
          <h2>{seller.legalName}</h2>
          {seller.brandName && <p className="tax-muted">Brand: {seller.brandName}</p>}
          <p>{seller.address}</p>
          {seller.udyam && <p>UDYAM : {seller.udyam}</p>}
          {seller.gstin && <p>GSTIN/UIN: {seller.gstin}</p>}
          {(seller.stateName || seller.stateCode) && (
            <p>
              State Name : {seller.stateName || "—"}
              {seller.stateCode ? `, Code : ${seller.stateCode}` : ""}
            </p>
          )}
          {seller.email && <p>E-Mail : {seller.email}</p>}
          {seller.phone && <p>Phone : {seller.phone}</p>}
        </div>

        <div className="tax-invoice-meta-grid">
          <div>
            <span>Invoice No.</span>
            <strong>{invoiceNo}</strong>
          </div>
          <div>
            <span>Dated</span>
            <strong>
              {dated.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })}
            </strong>
          </div>
          <div>
            <span>Reference No. & Date</span>
            <strong>{reference?.instance || "—"}</strong>
          </div>
          <div>
            <span>Other References</span>
            <strong>{reference?.site ? "Task Manager" : "Website"}</strong>
          </div>
          <div>
            <span>Buyer's Order No.</span>
            <strong>—</strong>
          </div>
          <div>
            <span>Mode/Terms of Payment</span>
            <strong>UPI / Bank Transfer</strong>
          </div>
        </div>
      </div>

      <div className="tax-invoice-buyer">
        <div>
          <h3>Buyer (Bill to)</h3>
          <p>
            <strong>{buyer.company}</strong>
          </p>
          {buyer.address && <p>{buyer.address}</p>}
          {buyer.gstin && <p>GSTIN/UIN : {buyer.gstin}</p>}
          {(buyer.stateName || buyer.stateCode) && (
            <p>
              State Name : {buyer.stateName || "—"}
              {buyer.stateCode ? `, Code : ${buyer.stateCode}` : ""}
            </p>
          )}
          <p>Place of Supply : {placeOfSupply}</p>
          {buyer.contactPerson && <p>Contact person : {buyer.contactPerson}</p>}
          {buyer.phone && <p>Contact : {buyer.phone}</p>}
          {buyer.email && <p>E-Mail : {buyer.email}</p>}
        </div>
        <div>
          <h3>Subscription Reference</h3>
          {reference?.plan && <p>Plan : {PLANS[reference.plan].name}</p>}
          {reference?.instance && <p>Instance : {reference.instance}</p>}
          {reference?.site && <p>Site : {reference.site}</p>}
          {reference?.trialEnd && <p>Current trial end : {reference.trialEnd}</p>}
          {reference?.extendTo && <p>Extend to : {reference.extendTo}</p>}
        </div>
      </div>

      <table className="tax-lines">
        <thead>
          <tr>
            <th style={{ width: "6%" }}>Sl</th>
            <th>Particulars</th>
            <th style={{ width: "10%" }}>HSN/SAC</th>
            <th style={{ width: "8%" }}>Quantity</th>
            <th style={{ width: "8%" }}>Unit</th>
            <th style={{ width: "12%" }}>Rate</th>
            <th style={{ width: "14%" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={line.particulars}>
              <td>{i + 1}</td>
              <td>
                <strong>{line.particulars}</strong>
              </td>
              <td>{line.hsn}</td>
              <td className="num">{line.qty}</td>
              <td>{line.unit}</td>
              <td className="num">{fmt(line.rate)}</td>
              <td className="num">{fmt(line.amount)}</td>
            </tr>
          ))}
          <tr>
            <td />
            <td>
              <strong>Output CGST @ 9%</strong>
            </td>
            <td />
            <td />
            <td />
            <td />
            <td className="num">{fmt(gst.cgst)}</td>
          </tr>
          <tr>
            <td />
            <td>
              <strong>Output SGST @ 9%</strong>
            </td>
            <td />
            <td />
            <td />
            <td />
            <td className="num">{fmt(gst.sgst)}</td>
          </tr>
          <tr className="tax-total-row">
            <td />
            <td>
              <strong>Total</strong>
            </td>
            <td />
            <td className="num">
              <strong>{lines.reduce((s, l) => s + l.qty, 0)}</strong>
            </td>
            <td />
            <td />
            <td className="num">
              <strong>₹{fmt(gst.grandTotal)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="tax-words">
        <strong>Amount Chargeable (in words)</strong>
        <span>E. &amp; O.E</span>
        <br />
        {amountInWordsInr(gst.grandTotal)}
      </p>

      <table className="tax-summary">
        <thead>
          <tr>
            <th>HSN/SAC</th>
            <th>Taxable Value</th>
            <th>Central Tax Rate</th>
            <th>Central Tax Amount</th>
            <th>State Tax Rate</th>
            <th>State Tax Amount</th>
            <th>Total Tax Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{DEFAULT_SAC}</td>
            <td className="num">{fmt(gst.taxable)}</td>
            <td className="num">9%</td>
            <td className="num">{fmt(gst.cgst)}</td>
            <td className="num">9%</td>
            <td className="num">{fmt(gst.sgst)}</td>
            <td className="num">{fmt(gst.totalTax)}</td>
          </tr>
          <tr className="tax-total-row">
            <td>
              <strong>Total</strong>
            </td>
            <td className="num">
              <strong>{fmt(gst.taxable)}</strong>
            </td>
            <td />
            <td className="num">
              <strong>{fmt(gst.cgst)}</strong>
            </td>
            <td />
            <td className="num">
              <strong>{fmt(gst.sgst)}</strong>
            </td>
            <td className="num">
              <strong>{fmt(gst.totalTax)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="tax-words">
        <strong>Tax Amount (in words) :</strong> {amountInWordsInr(gst.totalTax)}
      </p>

      {remarks && (
        <p className="tax-remarks">
          <strong>Remarks:</strong> {remarks}
        </p>
      )}

      <div className="tax-footer-grid">
        <div className="tax-bank">
          <h4>Company&apos;s Bank Details</h4>
          <p>
            <strong>Bank Name :</strong> {seller.bankName}
            {seller.accountType ? ` (${seller.accountType})` : ""}
          </p>
          <p>
            <strong>A/c No. :</strong> {seller.accountNumber}
          </p>
          <p>
            <strong>Branch &amp; IFS Code :</strong> {seller.bankBranch} &amp; {seller.ifsc}
          </p>
          <p>
            <strong>A/c Name :</strong> {seller.accountName}
          </p>
        </div>
        <div className="tax-sign">
          <p>for {seller.legalName}</p>
          <div className="tax-sign-space" />
          <p>
            <strong>Authorised Signatory</strong>
          </p>
        </div>
      </div>

      <p className="tax-jurisdiction">
        SUBJECT TO {(seller.jurisdiction || seller.stateName || "INDIA").toUpperCase()} JURISDICTION
      </p>
      <p className="tax-computer">This is a Computer Generated Invoice</p>

      {onPrint && (
        <button type="button" className="mkt-btn mkt-btn--ghost no-print" onClick={onPrint}>
          Print / Save PDF
        </button>
      )}
    </article>
  );
}
