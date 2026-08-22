import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TaxInvoice } from "../components/renew/TaxInvoice";
import { useAdminAuth } from "../context/AdminAuthContext";
import { API_BASE, adminApi } from "../constants/admin";
import { buildTaxInvoiceProps, type RenewalInvoiceData } from "../utils/renewalInvoice";
import { printTaxInvoice } from "../utils/printTaxInvoice";
import type { SellerInfo } from "../components/renew/TaxInvoice";
import "../admin.css";
import "../marketing.css";

const DEFAULT_SELLER: SellerInfo = {
  legalName: "SHREE S2N SOLUTIONS",
  brandName: "Kalpanik",
  address:
    "'SaRamya', 82 Gawande Layout, Baba Farid Nagar, Near Good Shephard Church, Off Koradi Road, Mankapur, Jhingabai Takli, Nagpur - 440030",
  gstin: "27ADEPT1039M1Z8",
  pan: "ADEPT1039M",
  email: "support@ss2n.in",
  phone: "+91-8007796333",
  stateName: "Maharashtra",
  stateCode: "27",
  udyam: "UDYAM-MH-20-0011047",
  jurisdiction: "Nagpur",
};

export function AdminBillPage() {
  const { invoiceNo } = useParams<{ invoiceNo: string }>();
  const { token, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [renewal, setRenewal] = useState<RenewalInvoiceData | null>(null);
  const [seller, setSeller] = useState<SellerInfo>(DEFAULT_SELLER);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !invoiceNo) return;
    if (!token) {
      setError("Sign in to admin first.");
      return;
    }

    let cancelled = false;

    Promise.all([
      fetch(adminApi(`/renewals/${encodeURIComponent(invoiceNo)}`), {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message ?? "Failed to load invoice");
        }
        return data.data as RenewalInvoiceData;
      }),
      fetch(`${API_BASE}/api/renewals/config`)
        .then((r) => r.json())
        .then((data) => (data.success ? (data.data.company as SellerInfo) : null))
        .catch(() => null),
    ])
      .then(([renewalData, company]) => {
        if (cancelled) return;
        setRenewal(renewalData);
        if (company) setSeller(company);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load invoice");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, authLoading, invoiceNo]);

  const invoiceProps = useMemo(() => {
    if (!renewal) return null;
    return buildTaxInvoiceProps(renewal, seller, { allowPrint: Boolean(renewal.utr) });
  }, [renewal, seller]);

  if (authLoading) {
    return <p className="admin-bill-status">Loading…</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-bill-status">
        <p>Sign in to view this invoice.</p>
        <Link to="/admin">Go to admin</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-bill-status admin-bill-status--error">
        <p>{error}</p>
        <Link to="/admin">Back to admin</Link>
      </div>
    );
  }

  if (!renewal || !invoiceProps) {
    return <p className="admin-bill-status">Loading invoice…</p>;
  }

  return (
    <div className="admin-bill-page mkt-shell">
      <div className="admin-bill-toolbar no-print">
        <Link to="/admin" className="admin-bill-back">
          ← Command centre
        </Link>
      </div>
      <div className="renew-pay-layout admin-bill-layout">
        <TaxInvoice
          {...invoiceProps}
          onPrint={() => printTaxInvoice(renewal.invoiceNo)}
        />
      </div>
    </div>
  );
}
