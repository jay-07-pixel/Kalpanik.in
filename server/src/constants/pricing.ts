export type PlanId = "task_management" | "task_attendance";

/** TEST: set to 0 to use real pricing. Flat total charged on every invoice. */
export const TEST_FLAT_BILL_INR = 1;

/** TEST pricing — restore 299/349 and storage 100 for production */
export const EXTRA_STORAGE_PRICE_PER_GB = 1;

export const PLAN_PRICES: Record<PlanId, number> = {
  task_management: 1,
  task_attendance: 1,
};

export const PLAN_NAMES: Record<PlanId, string> = {
  task_management: "Task Management",
  task_attendance: "Task + Attendance",
};

export const INSTANCE_FOLDERS: Record<string, string> = {
  "TM-SSPL": "Task_manager",
  "TM-SAFARI": "Task_manager_safari",
  "TM-SS2N": "Task_manager_ss2n",
  "TM-ACS": "Task_manager_acs",
  "TM-TACS": "Task_manager_tacs",
  "TM-ENSENS": "Task_manager_ensens",
  "TM-EDUNEST": "Task_manager_edunest",
};

export function isPlanId(value: string): value is PlanId {
  return value === "task_management" || value === "task_attendance";
}

export function calcTaxableInr(
  plan: PlanId,
  users: number,
  months: number,
  extraGb: number
): number {
  if (TEST_FLAT_BILL_INR > 0) return TEST_FLAT_BILL_INR;
  const planPrice = PLAN_PRICES[plan] ?? 0;
  const u = Math.max(1, Math.floor(users));
  const m = Math.max(1, Math.floor(months));
  const g = Math.max(0, Math.floor(extraGb));
  return planPrice * u * m + g * EXTRA_STORAGE_PRICE_PER_GB * m;
}

/** GST-inclusive total (matches tax invoice grand total). */
export function calcGrandTotalInr(
  plan: PlanId,
  users: number,
  months: number,
  extraGb: number
): number {
  if (TEST_FLAT_BILL_INR > 0) return TEST_FLAT_BILL_INR;
  const taxable = calcTaxableInr(plan, users, months, extraGb);
  return Math.round((taxable * 1.18 + Number.EPSILON) * 100) / 100;
}

export function calcAmountInr(
  plan: PlanId,
  users: number,
  months: number,
  extraGb: number
): number {
  return calcGrandTotalInr(plan, users, months, extraGb);
}

export function extendTrialEnd(from: string | null | undefined, months: number): string {
  const base = from ? new Date(from) : new Date();
  if (Number.isNaN(base.getTime())) {
    const now = new Date();
    now.setMonth(now.getMonth() + Math.max(1, months));
    return now.toISOString().slice(0, 10);
  }
  const start = base > new Date() ? base : new Date();
  start.setMonth(start.getMonth() + Math.max(1, months));
  return start.toISOString().slice(0, 10);
}
