/** Company marketing content — Kalpanik */

export const COMPANY = {
  brand: "Kalpanik",
  tagline: "Imagination, delivered",
  headline: "We deliver what you imagine",
  supporting:
    "Kalpanik means imagination—we turn it into software that runs your business: ready products and custom systems for how your teams actually work.",
  addressSnippet: "Maharashtra, India",
  emails: ["support@kalpanik.in"] as const,
  phone: "+91-9822961688",
  phoneHref: "tel:+919822961688",
} as const;

export const TRUSTED_BY: string[] = [
  "Sugandh Shoppee / Shree Sawaram",
  "AYSHA Construction",
  "AromaWrap",
  "Kailash Masale",
  "Safari",
  "TACS",
  "Ensens",
  "Edunest",
];

export interface ProductItem {
  id: string;
  name: string;
  blurb: string;
  platforms?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export const PRODUCTS: ProductItem[] = [
  {
    id: "task-manager",
    name: "Kalpanik Task Manager",
    blurb:
      "Multi-tenant work management for growing teams—tasks, chat, proofs, and optional GPS attendance. Available as Web PWA and Android.",
    platforms: "Web · Android",
    primaryHref: "/pricing",
    primaryLabel: "View pricing",
    secondaryHref: "/renew",
    secondaryLabel: "Renew subscription",
  },
  {
    id: "attendify",
    name: "Attendify",
    blurb:
      "Smart attendance with geofencing and activity summaries—ready to productize for field and office teams.",
    platforms: "Android · Web",
    primaryHref: "#contact",
    primaryLabel: "Ask about Attendify",
  },
];

export const CUSTOM_SOLUTIONS = {
  headline: "Custom solutions",
  supporting:
    "From idea to shipped system—we design around your workflow, not a bolted-on template.",
  items: [
    "Ops dashboards & internal tools",
    "Field Android apps with live location",
    "E-commerce & brand storefronts",
    "Survey, attendance & AI-assisted tools",
  ],
} as const;

export interface WorkCase {
  id: string;
  title: string;
  client: string;
  outcome: string;
  stack: string;
  href?: string;
  hrefLabel?: string;
}

export const WORK_CASES: WorkCase[] = [
  {
    id: "task-manager",
    title: "Kalpanik Task Manager",
    client: "Multi-tenant SaaS",
    outcome:
      "Delivered a production PWA and Android app for task ops, team chat, proofs, and attendance—used by businesses across India.",
    stack: "React · PWA · Android · multi-tenant cloud",
  },
  {
    id: "kailash",
    title: "Ops & field system",
    client: "Kailash Masale",
    outcome:
      "Delivered an operations dashboard paired with a field Android app so teams can run day-to-day work from the floor and on the road.",
    stack: "React · Android · real-time ops",
  },
  {
    id: "aromawrap",
    title: "Live brand store",
    client: "AromaWrap",
    outcome:
      "Delivered a live e-commerce storefront for product discovery and orders.",
    stack: "Web storefront",
    href: "https://aromawrap.co.in",
    hrefLabel: "aromawrap.co.in",
  },
  {
    id: "election-survey",
    title: "Election Survey System",
    client: "Field survey operations",
    outcome:
      "Delivered a survey platform for structured field data capture and reporting at scale.",
    stack: "Web · mobile-friendly forms · reporting",
  },
  {
    id: "attendify",
    title: "Attendify",
    client: "Smart attendance",
    outcome:
      "Delivered geofenced attendance with check-in/out and work-time summaries for teams that move between sites.",
    stack: "Android · geofencing · analytics",
  },
];

export interface Testimonial {
  quote: string;
  attribution: string;
  context: string;
}

/** Placeholder quotes — swap wording later without layout changes */
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Task Manager gave our teams one place for work, proofs, and follow-ups—without chasing people on WhatsApp.",
    attribution: "Operations lead",
    context: "Sugandh Shoppee / Shree Sawaram",
  },
  {
    quote:
      "The field app and dashboard finally matched how our spice ops actually run day to day.",
    attribution: "Business owner",
    context: "Kailash Masale",
  },
  {
    quote:
      "Our store went live cleanly and stays easy to update as the catalogue grows.",
    attribution: "Brand team",
    context: "AromaWrap",
  },
];
