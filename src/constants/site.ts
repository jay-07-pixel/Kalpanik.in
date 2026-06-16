export const SITE = {
  launchYear: 2026,
  email: "support@kalpanik.in",
} as const;

/** POST target for waitlist signups. Defaults to same-origin /api/waitlist in dev via Vite proxy. */
export const WAITLIST_ENDPOINT =
  import.meta.env.VITE_WAITLIST_URL?.trim() || "/api/waitlist";
