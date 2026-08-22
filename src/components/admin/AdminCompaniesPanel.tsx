import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../constants/admin";
import { PLANS, type PlanId } from "../../constants/pricing";

export interface CompanyOverviewRow {
  instance: string;
  company: string;
  email: string | null;
  site: string;
  vpsFolder: string;
  plan: string | null;
  licensedUsers: number | null;
  activeEmployees: number | null;
  storageIncludedGb: number | null;
  storageUsedGb: number | null;
  subscriptionEnd: string | null;
  lastRenewalAt: string | null;
  lastInvoiceNo: string | null;
  lastRenewalAmountInr: number | null;
  liveSynced: boolean;
  liveError: string | null;
}

interface AdminCompaniesPanelProps {
  token: string;
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtInr(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function storageLabel(used: number | null, included: number | null): string {
  if (used !== null && included !== null) return `${used} / ${included} GB`;
  if (included !== null) return `— / ${included} GB`;
  if (used !== null) return `${used} GB used`;
  return "—";
}

function planLabel(plan: string | null): string {
  if (!plan) return "—";
  if (plan in PLANS) return PLANS[plan as PlanId].name;
  return plan.replace(/_/g, " ");
}

export function AdminCompaniesPanel({ token }: AdminCompaniesPanelProps) {
  const [rows, setRows] = useState<CompanyOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch(adminApi("/companies"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message ?? "Failed to load companies");
          return;
        }
        setRows(data.data);
        setError("");
      })
      .catch(() => setError("Failed to load companies"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="admin-section admin-companies">
      <div className="admin-renewals-top">
        <div>
          <h2 className="admin-section-title admin-renewals-heading">All companies</h2>
          <p className="admin-renewals-hint">
            Subscription status across every Task Manager instance — employees, storage, renewal dates.
          </p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="admin-btn-ghost" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="admin-error-banner">{error}</p>}

      <div className="admin-chart-card admin-companies-table-wrap">
        {loading && rows.length === 0 ? (
          <div className="admin-loading-inline">
            <div className="admin-spinner" />
            <span>Loading companies…</span>
          </div>
        ) : rows.length === 0 ? (
          <p className="admin-empty">No companies configured.</p>
        ) : (
          <div className="admin-renewals-table-scroll">
            <table className="admin-renewals-table admin-companies-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Plan</th>
                  <th>Employees</th>
                  <th>Storage</th>
                  <th>Subscription ends</th>
                  <th>Last renewal</th>
                  <th>Site</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.instance}>
                    <td>
                      <div className="admin-renewals-cell-main">{row.company}</div>
                      <span className="admin-renewals-muted">{row.instance}</span>
                      {row.email && <span className="admin-renewals-muted">{row.email}</span>}
                      {!row.liveSynced && row.liveError && (
                        <span className="admin-companies-live-warn" title={row.liveError}>
                          Live stats unavailable
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="admin-renewals-cell-main">{planLabel(row.plan)}</div>
                      <span className="admin-renewals-muted">{row.vpsFolder}</span>
                    </td>
                    <td>
                      <div className="admin-renewals-cell-main">
                        {row.activeEmployees ?? row.licensedUsers ?? "—"}
                      </div>
                      {row.licensedUsers !== null && row.activeEmployees !== row.licensedUsers && (
                        <span className="admin-renewals-muted">{row.licensedUsers} licensed</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-renewals-cell-main">
                        {storageLabel(row.storageUsedGb, row.storageIncludedGb)}
                      </div>
                    </td>
                    <td>
                      <div className="admin-renewals-cell-main">{fmtDate(row.subscriptionEnd)}</div>
                      {row.liveSynced && (
                        <span className="admin-renewals-badge admin-renewals-badge--synced">Live</span>
                      )}
                    </td>
                    <td>
                      {row.lastInvoiceNo ? (
                        <>
                          <div className="admin-renewals-cell-main">{fmtDate(row.lastRenewalAt)}</div>
                          <span className="admin-renewals-muted">{row.lastInvoiceNo}</span>
                          {row.lastRenewalAmountInr !== null && (
                            <span className="admin-renewals-muted">₹{fmtInr(row.lastRenewalAmountInr)}</span>
                          )}
                        </>
                      ) : (
                        <span className="admin-renewals-muted">No renewal yet</span>
                      )}
                    </td>
                    <td>
                      <a
                        className="admin-renewals-site-link"
                        href={row.site}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
