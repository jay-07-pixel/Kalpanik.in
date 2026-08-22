/** Shared Kalpanik Task Manager pricing — keep in sync with marketing UI */

export type PlanId = "task_management" | "task_attendance";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** Actual charge per user / month (after special discount). */
  pricePerUser: number;
  /** Display MRP before 50% special discount (= 2× pricePerUser). */
  listPricePerUser: number;
  storageGbPerUser: number;
  tagline: string;
  features: string[];
  includesPrevious?: boolean;
}

export const BRAND = {
  name: "Kalpanik",
  tagline: "Manage Tasks. Track Work. Grow Together.",
  hero: "Powerful Work Management. Choose Your Plan.",
  trialBadge: "30-DAY FREE TRIAL · Up to 5 Employees",
  specialOffer: "50% OFF — Special offer for our lucky customers",
  supportEmail: "support@kalpanik.in",
  website: "https://kalpanik.in",
} as const;

export const SPECIAL_DISCOUNT_PERCENT = 50;
/** TEST: set to 0 to use real pricing. Flat total charged on every invoice. */
export const TEST_FLAT_BILL_INR = 1;
/** TEST: set back to 100 / 200 for production */
export const EXTRA_STORAGE_PRICE_PER_GB = 1;
export const EXTRA_STORAGE_LIST_PRICE_PER_GB = 2;

export const PLANS: Record<PlanId, PlanDefinition> = {
  task_management: {
    id: "task_management",
    name: "Task Management",
    pricePerUser: 1,
    listPricePerUser: 2,
    storageGbPerUser: 1,
    tagline: "Complete task & team collaboration suite",
    features: [
      "Unlimited Tasks",
      "Categories & Subtasks",
      "Assignment & Priorities",
      "Recurring Tasks",
      "Status & Updates",
      "Proof Submission (Image/Video/PDF)",
      "Voice Notes",
      "Team Chat (1-to-1 & Group)",
      "Push Notifications",
      "Smart Reminders",
      "Appointment & Deadline Reminders",
      "Deadline Extension",
      "Reports & Analytics",
      "Employee Productivity Overview",
      "Multi-language",
      "Android App & Web Access",
    ],
  },
  task_attendance: {
    id: "task_attendance",
    name: "Task + Attendance",
    pricePerUser: 1,
    listPricePerUser: 2,
    storageGbPerUser: 1,
    tagline: "Everything in Task Management + field & attendance",
    includesPrevious: true,
    features: [
      "Live GPS tracking",
      "Check-in/out",
      "Geofenced & Automatic Attendance",
      "Work/Extra Hours",
      "Attendance History",
      "Daily/Monthly Attendance Reports",
      "Work Time & Activity Summary",
      "Employee Performance Reports",
      "Late/Early, Overtime & Leave Reports",
      "Live Location Sharing",
      "Field Force Management",
      "Owner Dashboard (Capacity & Performance)",
    ],
  },
};

export const TRUST_POINTS = [
  "Secure & Reliable",
  "Mobile First",
  "Detailed Reports",
  "Smart Reminders",
  "Role-Based Access",
  "Data Backup",
  "Priority Support",
] as const;

/** Instance code → VPS folder name for manual activation checklist */
export const INSTANCE_FOLDERS: Record<string, string> = {
  "TM-SSPL": "Task_manager",
  "TM-SAFARI": "Task_manager_safari",
  "TM-SS2N": "Task_manager_ss2n",
  "TM-ACS": "Task_manager_acs",
  "TM-TACS": "Task_manager_tacs",
  "TM-ENSENS": "Task_manager_ensens",
  "TM-EDUNEST": "Task_manager_edunest",
};

export function calcAmountInr(
  plan: PlanId,
  users: number,
  months: number,
  extraGb: number
): number {
  if (TEST_FLAT_BILL_INR > 0) return TEST_FLAT_BILL_INR;
  const planPrice = PLANS[plan]?.pricePerUser ?? 0;
  const u = Math.max(1, Math.floor(users));
  const m = Math.max(1, Math.floor(months));
  const g = Math.max(0, Math.floor(extraGb));
  return planPrice * u * m + g * EXTRA_STORAGE_PRICE_PER_GB * m;
}

export function storageIncludedGb(users: number): number {
  return Math.max(1, Math.floor(users)) * 1;
}

export function isPlanId(value: string): value is PlanId {
  return value === "task_management" || value === "task_attendance";
}
