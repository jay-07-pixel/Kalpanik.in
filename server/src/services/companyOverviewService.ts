import { config } from "../config.js";
import { COMPANY_REGISTRY } from "../constants/companies.js";
import { INSTANCE_FOLDERS, PLAN_NAMES, type PlanId } from "../constants/pricing.js";
import { pool } from "../db/pool.js";
import type { RenewalRow } from "./renewalService.js";

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

interface LiveSiteStatus {
  ok: boolean;
  trialEnd?: string | null;
  plan?: string | null;
  maxUsers?: number | null;
  employeeCount?: number | null;
  storageUsedGb?: number | null;
  error?: string;
}

async function getLatestRenewalPerInstance(): Promise<Map<string, RenewalRow>> {
  const [rows] = await pool.query<RenewalRow[]>(
    `SELECT r.* FROM renewals r
     INNER JOIN (
       SELECT instance, MAX(id) AS max_id
       FROM renewals
       WHERE instance IS NOT NULL AND instance != ''
       GROUP BY instance
     ) latest ON r.id = latest.max_id`
  );

  const map = new Map<string, RenewalRow>();
  for (const row of rows) {
    if (row.instance) map.set(row.instance, row);
  }
  return map;
}

async function fetchLiveSiteStatus(site: string): Promise<LiveSiteStatus> {
  const base = site.replace(/\/$/, "");
  const url = `${base}/api/company/subscription/status`;
  try {
    const res = await fetch(url, {
      headers: { "X-Kalpanik-Secret": config.activation.secret },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: text.slice(0, 120) || `HTTP ${res.status}` };
    }
    const data = (await res.json()) as LiveSiteStatus;
    return { ...data, ok: Boolean(data.ok) };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unreachable";
    return { ok: false, error: msg };
  }
}

function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    const s = String(value).trim();
    return s ? s.slice(0, 10) : null;
  }
  return d.toISOString().slice(0, 10);
}

function parseOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : null;
}

export async function getCompaniesOverview(): Promise<CompanyOverviewRow[]> {
  const renewals = await getLatestRenewalPerInstance();

  const entries = await Promise.all(
    Object.entries(COMPANY_REGISTRY).map(async ([instance, meta]) => {
      const renewal = renewals.get(instance);
      const site = (renewal?.site?.trim() || meta.defaultSite).replace(/\/$/, "");
      const live = await fetchLiveSiteStatus(site);

      const licensedUsers = renewal?.users ?? parseOptionalInt(live.maxUsers);
      const extraGb = renewal?.extra_gb ?? 0;
      const storageIncludedGb =
        licensedUsers !== null ? licensedUsers * 1 + extraGb : null;

      const planId = renewal?.plan as PlanId | undefined;
      const plan =
        (planId && PLAN_NAMES[planId]) ||
        (live.plan ? String(live.plan) : null);

      const subscriptionEnd =
        formatDate(live.trialEnd) ??
        formatDate(renewal?.trial_end_extend_to) ??
        formatDate(renewal?.trial_end);

      const lastRenewalAt = renewal?.paid_at ?? renewal?.created_at ?? null;

      return {
        instance,
        company: renewal?.company ?? meta.label,
        email: renewal?.email ?? null,
        site,
        vpsFolder: INSTANCE_FOLDERS[instance] ?? instance,
        plan,
        licensedUsers,
        activeEmployees: parseOptionalInt(live.employeeCount) ?? licensedUsers,
        storageIncludedGb,
        storageUsedGb: parseOptionalInt(live.storageUsedGb),
        subscriptionEnd,
        lastRenewalAt: lastRenewalAt ? new Date(lastRenewalAt).toISOString() : null,
        lastInvoiceNo: renewal?.invoice_no ?? null,
        lastRenewalAmountInr: renewal ? Number(renewal.amount_inr) : null,
        liveSynced: live.ok,
        liveError: live.ok ? null : live.error ?? "Status API unavailable",
      } satisfies CompanyOverviewRow;
    })
  );

  return entries.sort((a, b) => a.company.localeCompare(b.company));
}
