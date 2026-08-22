import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../constants/admin";
import { PLANS, type PlanId } from "../../constants/pricing";

interface RenewalItem {
  invoiceNo: string;
  company: string;
  email: string;
  users: number;
  plan: PlanId;
  months: number;
  extraGb: number;
  amountInr: number;
  instance: string | null;
  site: string | null;
  status: string;
  utr: string | null;
  screenshotPath: string | null;
  trialEndExtendTo: string | null;
  activationNote: string | null;
  activationStatus: string | null;
  vpsFolder: string | null;
  createdAt: string;
}

interface AdminRenewalsPanelProps {
  token: string;
}

type RenewalFilter = "submitted" | "paid" | "all";

export function AdminRenewalsPanel({ token }: AdminRenewalsPanelProps) {
  const [rows, setRows] = useState<RenewalItem[]>([]);
  const [filter, setFilter] = useState<RenewalFilter>("submitted");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [folders, setFolders] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    const statusParam = filter === "submitted" ? "submitted" : filter;
    fetch(adminApi(`/renewals?status=${statusParam}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message ?? "Failed to load renewals");
          return;
        }
        setRows(data.data);
        setFolders(data.instanceFolders ?? {});
        setError("");
      })
      .catch(() => setError("Failed to load renewals"));
  }, [token, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const markPaid = async (invoiceNo: string) => {
    setBusy(invoiceNo);
    try {
      const res = await fetch(adminApi(`/renewals/${invoiceNo}/mark-paid`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? "Mark paid failed");
        return;
      }
      if (data.activation?.note) {
        setError(data.activation.ok ? "" : data.activation.note);
      }
      load();
    } catch {
      setError("Mark paid failed");
    } finally {
      setBusy(null);
    }
  };

  const openBill = async (invoiceNo: string) => {
    setBusy(`bill-${invoiceNo}`);
    try {
      const res = await fetch(adminApi(`/renewals/${invoiceNo}/bill`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Failed to load bill");
        return;
      }
      const html = await res.text();
      const win = window.open("", "_blank", "noopener,noreferrer,width=920,height=1200");
      if (!win) {
        setError("Pop-up blocked. Allow pop-ups to view the bill.");
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      setError("");
    } catch {
      setError("Failed to open bill");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="admin-section admin-renewals">
      <div className="admin-header" style={{ marginBottom: "1rem", border: "none", padding: 0 }}>
        <h2 className="admin-section-title" style={{ margin: 0 }}>
          Subscription Renewals
        </h2>
        <div className="admin-header-actions">
          {(
            [
              ["submitted", "Submitted"],
              ["paid", "Paid"],
              ["all", "All submitted"],
            ] as const
          ).map(([f, label]) => (
            <button
              key={f}
              type="button"
              className={filter === f ? "admin-btn-primary" : "admin-btn-ghost"}
              onClick={() => setFilter(f)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="admin-renewals-hint">
        Only customers who submitted UTR / payment proof appear here.
      </p>

      {error && <p className="admin-error-banner">{error}</p>}

      <div className="admin-chart-card" style={{ overflowX: "auto" }}>
        {rows.length === 0 ? (
          <p className="admin-empty">No submitted renewals in this filter.</p>
        ) : (
          <table className="admin-renewals-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>UTR</th>
                <th>Instance / VPS</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.invoiceNo}>
                  <td>
                    <strong>{row.invoiceNo}</strong>
                    <div className="muted">{row.status}</div>
                  </td>
                  <td>
                    {row.company}
                    <div className="muted">{row.email}</div>
                  </td>
                  <td>
                    {PLANS[row.plan]?.name ?? row.plan}
                    <div className="muted">
                      {row.users} users · {row.months} mo
                      {row.extraGb ? ` · +${row.extraGb} GB` : ""}
                    </div>
                  </td>
                  <td>₹{row.amountInr.toLocaleString("en-IN")}</td>
                  <td>
                    <strong>{row.utr}</strong>
                    {row.screenshotPath && (
                      <div className="muted">
                        <a href={row.screenshotPath} target="_blank" rel="noreferrer">
                          View screenshot
                        </a>
                      </div>
                    )}
                  </td>
                  <td>
                    {row.instance || "—"}
                    <div className="muted">
                      {row.vpsFolder || folders[row.instance ?? ""] || "unmapped"}
                    </div>
                    {row.trialEndExtendTo && (
                      <div className="muted">extend → {row.trialEndExtendTo}</div>
                    )}
                    {row.activationNote && <div className="muted">{row.activationNote}</div>}
                  </td>
                  <td>
                    <div className="admin-renewals-actions">
                      <button
                        type="button"
                        className="admin-btn-ghost"
                        disabled={busy === `bill-${row.invoiceNo}`}
                        onClick={() => openBill(row.invoiceNo)}
                      >
                        {busy === `bill-${row.invoiceNo}` ? "…" : "Download Bill"}
                      </button>
                      {row.status !== "paid" ? (
                        <button
                          type="button"
                          className="admin-btn-primary"
                          disabled={busy === row.invoiceNo}
                          onClick={() => markPaid(row.invoiceNo)}
                        >
                          {busy === row.invoiceNo ? "…" : "Mark Paid"}
                        </button>
                      ) : (
                        <span className="muted">{row.activationStatus}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-chart-card" style={{ marginTop: "1rem" }}>
        <h3 className="admin-chart-title">Manual VPS checklist (if webhook missing)</h3>
        <ul className="admin-signup-list">
          {Object.entries(folders).map(([code, folder]) => (
            <li key={code}>
              <span className="admin-signup-email">
                {code} → {folder}
              </span>
              <span className="admin-signup-date">update COMPANY_TRIAL_END</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
