export const SITE = {
  launchYear: 2026,
  email: "hello@kalpanik.in",
} as const;

export const WAITLIST_KEY = "kalpanik_waitlist";
export const WAITLIST_ENDPOINT = import.meta.env.VITE_WAITLIST_URL as string | undefined;
