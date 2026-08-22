import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../constants/admin";
import { PLANS, type PlanId } from "../../constants/pricing";

function fmtInr(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function activationLabel(status: string | null): string {
  if (status === "webhook_ok") return "Synced";
  if (status === "webhook_failed") return "Sync failed";
  if (status === "manual") return "Manual";
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

  return (
    <div className="admin-renewals-edit">
      <h4 className="admin-chart-title">Edit subscription — {row.invoiceNo}</h4>
      <p className="muted">
        {row.company} · {row.instance ?? "no instance"}
        {row.site ? ` · ${row.site}` : ""}
      </p>
      <div className="admin-renewals-edit-grid">
        <label>
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
        <label>
          Users
          <input
            type="number"
            min={1}
            value={draft.users}
            onChange={(e) => setDraft((d) => ({ ...d, users: Number(e.target.value) || 1 }))}
          />
        </label>
        <label>
          Months
          <input
            type="number"
            min={1}
            value={draft.months}
            onChange={(e) => setDraft((d) => ({ ...d, months: Number(e.target.value) || 1 }))}
          />
        </label>
        <label>
          Extra GB
          <input
            type="number"
            min={0}
            value={draft.extraGb}
            onChange={(e) => setDraft((d) => ({ ...d, extraGb: Number(e.target.value) || 0 }))}
          />
        </label>
        <label>
          Subscription valid until
          <input
            type="date"
            value={draft.trialEndExtendTo}
            onChange={(e) => setDraft((d) => ({ ...d, trialEndExtendTo: e.target.value }))}
          />
        </label>
        <label>
          Company site URL
          <input
            type="url"
            placeholder="https://acs.kalpanik.in"
            value={draft.site}
            onChange={(e) => setDraft((d) => ({ ...d, site: e.target.value }))}
          />
        </label>
      </div>
      {row.activationNote && (
        <p className="admin-activation-note">{row.activationNote}</p>
      )}
      <div className="admin-renewals-actions admin-renewals-edit-actions">
        <button type="button" className="admin-btn-ghost" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="admin-btn-ghost" disabled={busy} onClick={() => onSave(draft)}>
          Save only
        </button>
        <button
          type="button"
          className="admin-btn-primary"
          disabled={busy}
          onClick={() => onSaveAndSync(draft)}
        >
          {busy ? "…" : "Save & sync to site"}
        </button>
        <button type="button" className="admin-btn-ghost" disabled={busy} onClick={onSyncOnly}>
          Sync without saving
        </button>
      </div>
    </div>
  );
}

export function AdminRenewalsPanel({ token }: AdminRenewalsPanelProps) {
  const [rows, setRows] = useState<RenewalItem[]>([]);
  const [filter, setFilter] = useState<RenewalFilter>("submitted");
  const [lookupInvoice, setLookupInvoice] = useState("KLP-20260820-8341");
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
        Edit subscription details here and sync to the company Task Manager site. Sync calls{" "}
        <code>/api/company/subscription/activate</code> on the site URL.
      </p>

      <div className="admin-chart-card admin-renewals-lookup">
        <h3 className="admin-chart-title">Mark payment received (manual)</h3>
        <div className="admin-renewals-lookup-row">
          <input
            value={lookupInvoice}
            onChange={(e) => setLookupInvoice(e.target.value)}
            placeholder="Invoice number e.g. KLP-20260820-8341"
          />
          <button
            type="button"
            className="admin-btn-ghost"
            disabled={busy?.startsWith("lookup-")}
            onClick={lookupRenewal}
          >
            Find
          </button>
        </div>
        {lookupRow && (
          <div className="admin-renewals-lookup-result">
            <p>
              <strong>{lookupRow.company}</strong> — {lookupRow.email}
            </p>
            <p className="muted">
              {PLANS[lookupRow.plan]?.name} · {lookupRow.users} users · {lookupRow.months} mo · ₹
              {fmtInr(lookupRow.amountInr)} (incl. GST) · <strong>{lookupRow.status}</strong>
              {lookupRow.utr ? ` · UTR ${lookupRow.utr}` : ""}
            </p>
            <div className="admin-renewals-actions">
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => openBill(lookupRow.invoiceNo)}
              >
                Download Bill
              </button>
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => startEdit(lookupRow)}
              >
                Edit & sync
              </button>
              {lookupRow.status !== "paid" && (
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={busy === lookupRow.invoiceNo}
                  onClick={() => markPaid(lookupRow.invoiceNo)}
                >
                  {busy === lookupRow.invoiceNo ? "…" : "Mark Paid & Activate"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {editingRow && (
        <div className="admin-chart-card">
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

      {error && <p className="admin-error-banner">{error}</p>}
      {success && <p className="admin-success-banner">{success}</p>}

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
                <th>Total (incl. GST)</th>
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
                  <td>₹{fmtInr(row.amountInr)}</td>
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
                      <div className="muted">valid until {toDateInputValue(row.trialEndExtendTo)}</div>
                    )}
                    {row.activationNote && (
                      <div className="admin-activation-note">{row.activationNote}</div>
                    )}
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
                      <button
                        type="button"
                        className="admin-btn-ghost"
                        onClick={() => startEdit(row)}
                      >
                        Edit & sync
                      </button>
                      {row.status === "paid" && row.activationStatus !== "webhook_ok" && (
                        <>
                          <button
                            type="button"
                            className="admin-btn-primary"
                            disabled={busy === `sync-${row.invoiceNo}`}
                            onClick={() => syncToSite(row.invoiceNo)}
                          >
                            {busy === `sync-${row.invoiceNo}` ? "…" : "Retry sync"}
                          </button>
                          <button
                            type="button"
                            className="admin-btn-ghost"
                            disabled={busy === `manual-${row.invoiceNo}`}
                            onClick={() => markManual(row.invoiceNo)}
                          >
                            {busy === `manual-${row.invoiceNo}` ? "…" : "Mark manual (VPS done)"}
                          </button>
                        </>
                      )}
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
                        <span className="muted">{activationLabel(row.activationStatus)}</span>
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
        <h3 className="admin-chart-title">Manual VPS fallback</h3>
        <p className="admin-renewals-hint" style={{ marginTop: 0 }}>
          If sync fails (endpoint not deployed yet), set <code>COMPANY_TRIAL_END</code> in the VPS
          folder for that instance.
        </p>
        <ul className="admin-signup-list">
          {Object.entries(folders).map(([code, folder]) => (
            <li key={code}>
              <span className="admin-signup-email">
                {code} → {folder}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
