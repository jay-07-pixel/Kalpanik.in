/** Known Task Manager tenants — keep in sync with src/constants/companies.ts */

export interface CompanyRegistryEntry {
  label: string;
  defaultSite: string;
}

export const COMPANY_REGISTRY: Record<string, CompanyRegistryEntry> = {
  "TM-SSPL": {
    label: "Shree Sawaram Incense",
    defaultSite: "https://sugandhshoppee.kalpanik.in",
  },
  "TM-ACS": {
    label: "AYSHA Construction & Engineering",
    defaultSite: "https://acs.kalpanik.in",
  },
  "TM-SAFARI": {
    label: "Safari",
    defaultSite: "https://safari.kalpanik.in",
  },
  "TM-SS2N": {
    label: "Shree S2N Solutions",
    defaultSite: "https://ss2n.kalpanik.in",
  },
  "TM-TACS": {
    label: "TACS",
    defaultSite: "https://tacs.kalpanik.in",
  },
  "TM-ENSENS": {
    label: "Ensens",
    defaultSite: "https://ensens.kalpanik.in",
  },
  "TM-EDUNEST": {
    label: "Edunest",
    defaultSite: "https://edunest.kalpanik.in",
  },
};
