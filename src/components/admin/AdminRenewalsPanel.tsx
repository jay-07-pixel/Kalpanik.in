import { useCallback, useEffect, useState, type ReactNode } from "react";
import { adminApi } from "../../constants/admin";
import { PLANS, type PlanId } from "../../constants/pricing";

function fmtInr(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

type BadgeTone = "neutral" | "pending" | "paid" | "synced" | "failed" | "manual";

function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`admin-renewals-badge admin-renewals-badge--${tone}`}>{children}</span>;
}

function syncTone(status: string | null, note: string | null): BadgeTone {
  if (status === "webhook_ok") return "synced";
  if (status === "manual") return "manual";
  if (status === "webhook_failed" || (note && /error|failed|manual:/i.test(note))) return "failed";
  return "neutral";
}

function syncLabel(status: string | null): string {
  if (status === "webhook_ok") return "Synced";
  if (status === "webhook_failed") return "Sync failed";
  if (status === "manual") return "Manual";
  if (status === "pending") return "Not synced";
  return status ?? "—";
}

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

interface EditDraft {
  plan: PlanId;
  users: number;
  months: number;
  extraGb: number;
  trialEndExtendTo: string;
  site: string;
}

interface AdminRenewalsPanelProps {
  token: string;
}

type RenewalFilter = "submitted" | "paid" | "all";

function RenewalEditForm({
  row,
  busy,
  onCancel,
  onSave,
  onSaveAndSync,
  onSyncOnly,
}: {
  row: RenewalItem;
  busy: boolean;
  onCancel: () => void;
  onSave: (draft: EditDraft) => void;
  onSaveAndSync: (draft: EditDraft) => void;
  onSyncOnly: () => void;
}) {
  const [draft, setDraft] = useState<EditDraft>({
    plan: row.plan,
    users: row.users,
    months: row.months,
    extraGb: row.extraGb,
    trialEndExtendTo: toDateInputValue(row.trialEndExtendTo),
    site: row.site ?? "",
  });

  useEffect(() => {
    setDraft({
      plan: row.plan,
      users: row.users,
      months: row.months,
      extraGb: row.extraGb,
      trialEndExtendTo: toDateInputValue(row.trialEndExtendTo),
      site: row.site ?? "",
    });
  }, [row]);

  const syncStatus = syncTone(row.activationStatus, row.activationNote);

  return (
    <div className="admin-renewals-edit">
      <div className="admin-renewals-edit-header">
        <div>
          <p className="admin-renewals-edit-eyebrow">Edit subscription</p>
          <h3 className="admin-renewals-edit-title">{row.invoiceNo}</h3>
          <p className="admin-renewals-edit-sub">
            {row.company} · {row.email}
          </p>
        </div>
        <button type="button" className="admin-btn-ghost admin-renewals-edit-close" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="admin-renewals-meta">
        <StatusBadge tone="neutral">{row.instance ?? "No instance"}</StatusBadge>
        <StatusBadge tone="neutral">{row.vpsFolder ?? "unmapped"}</StatusBadge>
        <StatusBadge tone={row.status === "paid" ? "paid" : "pending"}>{row.status}</StatusBadge>
        <StatusBadge tone={syncStatus}>{syncLabel(row.activationStatus)}</StatusBadge>
      </div>

      <div className="admin-renewals-edit-section">
        <p className="admin-renewals-edit-section-title">Subscription</p>
        <div className="admin-renewals-edit-grid">
          <label className="admin-renewals-field admin-renewals-field--wide">
            Plan
            <select
              value={draft.plan}
              onChange={(e) => setDraft((d) => ({ ...d, plan: e.target.value as PlanId }))}
            >
              {Object.values(PLANS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-renewals-field">
            Users
            <input
              type="number"
              min={1}
              value={draft.users}
              onChange={(e) => setDraft((d) => ({ ...d, users: Number(e.target.value) || 1 }))}
            />
          </label>
          <label className="admin-renewals-field">
            Months
            <input
              type="number"
              min={1}
              value={draft.months}
              onChange={(e) => setDraft((d) => ({ ...d, months: Number(e.target.value) || 1 }))}
            />
          </label>
          <label className="admin-renewals-field">
            Extra GB
            <input
              type="number"
              min={0}
              value={draft.extraGb}
              onChange={(e) => setDraft((d) => ({ ...d, extraGb: Number(e.target.value) || 0 }))}
            />
          </label>
          <label className="admin-renewals-field">
            Valid until
            <input
              type="date"
              value={draft.trialEndExtendTo}
              onChange={(e) => setDraft((d) => ({ ...d, trialEndExtendTo: e.target.value }))}
            />
          </label>
          <label className="admin-renewals-field admin-renewals-field--full">
            Company site URL
            <input
              type="url"
              placeholder="https://customer.kalpanik.in"
              value={draft.site}
              onChange={(e) => setDraft((d) => ({ ...d, site: e.target.value }))}
            />
          </label>
        </div>
      </div>

      {row.activationNote && (
        <div className={`admin-renewals-sync-banner admin-renewals-sync-banner--${syncStatus}`}>
          {row.activationNote}
        </div>
      )}

      <div className="admin-renewals-edit-footer">
        <button type="button" className="admin-btn-ghost" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <div className="admin-renewals-edit-footer-primary">
          <button type="button" className="admin-btn-ghost" disabled={busy} onClick={() => onSave(draft)}>
            Save only
          </button>
          <button type="button" className="admin-btn-ghost" disabled={busy} onClick={onSyncOnly}>
            Sync only
          </button>
          <button
            type="button"
            className="admin-btn-primary"
            disabled={busy}
            onClick={() => onSaveAndSync(draft)}
          >
            {busy ? "Working…" : "Save & sync to site"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminRenewalsPanel({ token }: AdminRenewalsPanelProps) {
  const [rows, setRows] = useState<RenewalItem[]>([]);
  const [filter, setFilter] = useState<RenewalFilter>("submitted");
  const [lookupInvoice, setLookupInvoice] = useState("");
  const [lookupRow, setLookupRow] = useState<RenewalItem | null>(null);
  const [editingRow, setEditingRow] = useState<RenewalItem | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  const handleActivationResult = (activation?: { ok: boolean; note: string }) => {
    if (!activation) return;
    if (activation.ok) {
      setSuccess(activation.note);
      setError("");
    } else {
      setError(activation.note);
      setSuccess("");
    }
  };

  const lookupRenewal = async () => {
    const invoiceNo = lookupInvoice.trim();
    if (!invoiceNo) return;
    setBusy(`lookup-${invoiceNo}`);
    setLookupRow(null);
    try {
      const res = await fetch(adminApi(`/renewals/${encodeURIComponent(invoiceNo)}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? "Invoice not found");
        return;
      }
      setLookupRow(data.data);
      setError("");
    } catch {
      setError("Lookup failed");
    } finally {
      setBusy(null);
    }
  };

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
      handleActivationResult(data.activation);
      load();
      if (lookupRow?.invoiceNo === invoiceNo) lookupRenewal();
    } catch {
      setError("Mark paid failed");
    } finally {
      setBusy(null);
    }
  };

  const syncToSite = async (invoiceNo: string) => {
    setBusy(`sync-${invoiceNo}`);
    try {
      const res = await fetch(adminApi(`/renewals/${invoiceNo}/sync`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? "Sync failed");
        return;
      }
      handleActivationResult(data.activation);
      load();
      if (lookupRow?.invoiceNo === invoiceNo) lookupRenewal();
      if (editingRow?.invoiceNo === invoiceNo) setEditingRow(data.data);
    } catch {
      setError("Sync failed");
    } finally {
      setBusy(null);
    }
  };

  const saveSubscription = async (invoiceNo: string, draft: EditDraft, syncToSiteFlag: boolean) => {
    setBusy(`save-${invoiceNo}`);
    setSuccess("");
    try {
      const res = await fetch(adminApi(`/renewals/${invoiceNo}`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: draft.plan,
          users: draft.users,
          months: draft.months,
          extraGb: draft.extraGb,
          trialEndExtendTo: draft.trialEndExtendTo || undefined,
          site: draft.site,
          syncToSite: syncToSiteFlag,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? "Save failed");
        return;
      }
      if (syncToSiteFlag) {
        handleActivationResult(data.activation);
      } else {
        setSuccess("Subscription saved.");
        setError("");
      }
      load();
      if (lookupRow?.invoiceNo === invoiceNo) lookupRenewal();
      setEditingRow(data.data);
    } catch {
      setError("Save failed");
    } finally {
      setBusy(null);
    }
  };

  const markManual = async (invoiceNo: string) => {
    setBusy(`manual-${invoiceNo}`);
    try {
      const res = await fetch(adminApi(`/renewals/${invoiceNo}/mark-manual`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? "Could not mark manual activation");
        return;
      }
      setSuccess("Marked as manually activated on VPS.");
      setError("");
      load();
      if (lookupRow?.invoiceNo === invoiceNo) lookupRenewal();
      if (editingRow?.invoiceNo === invoiceNo) setEditingRow(data.data);
    } catch {
      setError("Could not mark manual activation");
    } finally {
      setBusy(null);
    }
  };

  const openBill = (invoiceNo: string) => {
    const url = `/admin/bill/${encodeURIComponent(invoiceNo)}`;
    const win = window.open(url, "_blank");
    if (!win) {
      setError(
        `Pop-up blocked. Right-click Bill → Open link, or open: ${window.location.origin}${url}`
      );
      return;
    }
    setError("");
  };

  const startEdit = (row: RenewalItem) => {
    setEditingRow(row);
    setSuccess("");
    setError("");
  };

  const editBusy = editingRow
    ? busy === `save-${editingRow.invoiceNo}` || busy === `sync-${editingRow.invoiceNo}`
    : false;

  return (
    <section className="admin-section admin-renewals">
      <div className="admin-renewals-top">
        <div>
          <h2 className="admin-section-title admin-renewals-heading">Subscription renewals</h2>
          <p className="admin-renewals-hint">
            Review payments, edit plans, and push subscription dates to each company site.
          </p>
        </div>
        <div className="admin-header-actions">
          {(
            [
              ["submitted", "Submitted"],
              ["paid", "Paid"],
              ["all", "All"],
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

      {(error || success) && (
        <div className="admin-renewals-alerts">
          {error && <p className="admin-error-banner">{error}</p>}
          {success && <p className="admin-success-banner">{success}</p>}
        </div>
      )}

      <div className="admin-chart-card admin-renewals-lookup">
        <h3 className="admin-chart-title">Find invoice</h3>
        <p className="admin-renewals-card-desc">Look up any invoice to mark bank payment or edit subscription.</p>
        <div className="admin-renewals-lookup-row">
          <input
            value={lookupInvoice}
            onChange={(e) => setLookupInvoice(e.target.value)}
            placeholder="Invoice e.g. KLP-20260822-7571"
            onKeyDown={(e) => e.key === "Enter" && lookupRenewal()}
          />
          <button
            type="button"
            className="admin-btn-primary"
            disabled={busy?.startsWith("lookup-")}
            onClick={lookupRenewal}
          >
            Find
          </button>
        </div>
        {lookupRow && (
          <div className="admin-renewals-lookup-result">
            <div className="admin-renewals-lookup-summary">
              <div>
                <strong>{lookupRow.company}</strong>
                <span className="admin-renewals-muted">{lookupRow.email}</span>
              </div>
              <div className="admin-renewals-meta">
                <StatusBadge tone={lookupRow.status === "paid" ? "paid" : "pending"}>
                  {lookupRow.status}
                </StatusBadge>
                <StatusBadge tone="neutral">₹{fmtInr(lookupRow.amountInr)}</StatusBadge>
              </div>
            </div>
            <p className="admin-renewals-muted">
              {PLANS[lookupRow.plan]?.name} · {lookupRow.users} users · {lookupRow.months} mo
              {lookupRow.utr ? ` · UTR ${lookupRow.utr}` : ""}
            </p>
            <div className="admin-renewals-actions admin-renewals-actions--row">
              <button type="button" className="admin-btn-ghost" onClick={() => openBill(lookupRow.invoiceNo)}>
                Download bill
              </button>
              <button type="button" className="admin-btn-ghost" onClick={() => startEdit(lookupRow)}>
                Edit & sync
              </button>
              {lookupRow.status !== "paid" && (
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={busy === lookupRow.invoiceNo}
                  onClick={() => markPaid(lookupRow.invoiceNo)}
                >
                  {busy === lookupRow.invoiceNo ? "…" : "Mark paid & activate"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {editingRow && (
        <div className="admin-chart-card admin-renewals-edit-card">
          <RenewalEditForm
            row={editingRow}
            busy={editBusy}
            onCancel={() => setEditingRow(null)}
            onSave={(draft) => saveSubscription(editingRow.invoiceNo, draft, false)}
            onSaveAndSync={(draft) => saveSubscription(editingRow.invoiceNo, draft, true)}
            onSyncOnly={() => syncToSite(editingRow.invoiceNo)}
          />
        </div>
      )}

      <div className="admin-chart-card admin-renewals-table-wrap">
        <h3 className="admin-chart-title">Renewals</h3>
        {rows.length === 0 ? (
          <p className="admin-empty">No renewals in this filter.</p>
        ) : (
          <div className="admin-renewals-table-scroll">
            <table className="admin-renewals-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Instance</th>
                  <th>Sync</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isEditing = editingRow?.invoiceNo === row.invoiceNo;
                  const syncStatus = syncTone(row.activationStatus, row.activationNote);
                  return (
                    <tr key={row.invoiceNo} className={isEditing ? "admin-renewals-row--active" : undefined}>
                      <td>
                        <div className="admin-renewals-cell-main">{row.invoiceNo}</div>
                        <StatusBadge tone={row.status === "paid" ? "paid" : "pending"}>
                          {row.status}
                        </StatusBadge>
                      </td>
                      <td>
                        <div className="admin-renewals-cell-main">{row.company}</div>
                        <span className="admin-renewals-muted">{row.email}</span>
                        {row.utr && (
                          <span className="admin-renewals-muted admin-renewals-utr">UTR {row.utr}</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-renewals-cell-main">{PLANS[row.plan]?.name ?? row.plan}</div>
                        <span className="admin-renewals-muted">
                          {row.users} users · {row.months} mo
                          {row.extraGb ? ` · +${row.extraGb} GB` : ""}
                        </span>
                      </td>
                      <td>
                        <div className="admin-renewals-amount">₹{fmtInr(row.amountInr)}</div>
                        <span className="admin-renewals-muted">incl. GST</span>
                      </td>
                      <td>
                        <div className="admin-renewals-cell-main">{row.instance ?? "—"}</div>
                        <span className="admin-renewals-muted">
                          {row.vpsFolder || folders[row.instance ?? ""] || "unmapped"}
                        </span>
                        {row.trialEndExtendTo && (
                          <span className="admin-renewals-muted">
                            until {toDateInputValue(row.trialEndExtendTo)}
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge tone={syncStatus}>{syncLabel(row.activationStatus)}</StatusBadge>
                        {row.site && (
                          <a
                            className="admin-renewals-site-link"
                            href={row.site}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open site
                          </a>
                        )}
                      </td>
                      <td>
                        <div className="admin-renewals-actions admin-renewals-actions--row">
                          <button
                            type="button"
                            className="admin-btn-ghost admin-btn-sm"
                            onClick={() => openBill(row.invoiceNo)}
                          >
                            Bill
                          </button>
                          <button
                            type="button"
                            className={`admin-btn-ghost admin-btn-sm${isEditing ? " admin-btn-ghost--active" : ""}`}
                            onClick={() => startEdit(row)}
                          >
                            Edit
                          </button>
                          {row.status === "paid" && row.activationStatus !== "webhook_ok" && (
                            <>
                              <button
                                type="button"
                                className="admin-btn-primary admin-btn-sm"
                                disabled={busy === `sync-${row.invoiceNo}`}
                                onClick={() => syncToSite(row.invoiceNo)}
                              >
                                Sync
                              </button>
                              <button
                                type="button"
                                className="admin-btn-ghost admin-btn-sm"
                                disabled={busy === `manual-${row.invoiceNo}`}
                                onClick={() => markManual(row.invoiceNo)}
                              >
                                Manual
                              </button>
                            </>
                          )}
                          {row.status !== "paid" && (
                            <button
                              type="button"
                              className="admin-btn-primary admin-btn-sm"
                              disabled={busy === row.invoiceNo}
                              onClick={() => markPaid(row.invoiceNo)}
                            >
                              Mark paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <details className="admin-chart-card admin-renewals-vps-details">
        <summary className="admin-renewals-vps-summary">VPS instance folders</summary>
        <ul className="admin-signup-list admin-renewals-vps-list">
          {Object.entries(folders).map(([code, folder]) => (
            <li key={code}>
              <span className="admin-signup-email">{code}</span>
              <span className="admin-signup-date">{folder}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
