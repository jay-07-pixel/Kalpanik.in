import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(here, "../.env"), // dist-server/.env sibling → project root
  path.resolve(here, "../../.env"), // server/src → project root
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() ?? fallback;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: optional("CORS_ORIGIN", "http://localhost:5173"),
  db: {
    host: required("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
  },
  smtp: {
    host: required("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: required("SMTP_USER"),
    pass: required("SMTP_PASS"),
    from: optional("SMTP_FROM") || required("SMTP_USER"),
  },
  mail: {
    fromName: optional("MAIL_FROM_NAME", "Kalpanik"),
    replyTo: optional("MAIL_REPLY_TO", "support@kalpanik.in"),
    notifyTo: optional("ADMIN_NOTIFY_EMAIL", "support@kalpanik.in"),
  },
  admin: {
    email: required("ADMIN_EMAIL"),
    password: required("ADMIN_PASSWORD"),
    jwtSecret: required("JWT_SECRET"),
    jwtExpiresIn: optional("JWT_EXPIRES_IN", "24h"),
  },
  upi: {
    id: required("KALPANIK_UPI_ID"),
    name: optional("KALPANIK_UPI_NAME", "SHREE S2N SOLUTIONS"),
  },
  activation: {
    secret: required("KALPANIK_ACTIVATION_SECRET"),
  },
  invoice: {
    legalName: optional("KALPANIK_LEGAL_NAME", "SHREE S2N SOLUTIONS"),
    brandName: optional("KALPANIK_BRAND_NAME", "Kalpanik"),
    address: optional("KALPANIK_ADDRESS", "ANANDAM WORLD CITY"),
    gstin: optional("KALPANIK_GSTIN", ""),
    email: optional("KALPANIK_INVOICE_EMAIL", "support@kalpanik.in"),
    phone: optional("KALPANIK_INVOICE_PHONE", ""),
    stateName: optional("KALPANIK_STATE_NAME", ""),
    stateCode: optional("KALPANIK_STATE_CODE", ""),
    udyam: optional("KALPANIK_UDYAM", ""),
    jurisdiction: optional("KALPANIK_JURISDICTION", ""),
    bankName: optional("KALPANIK_BANK_NAME", "HDFC Bank"),
    bankBranch: optional("KALPANIK_BANK_BRANCH", "ANANDAM WORLD CITY"),
    accountName: optional("KALPANIK_ACCOUNT_NAME", "SHREE S2N SOLUTIONS"),
    accountNumber: optional("KALPANIK_ACCOUNT_NUMBER", ""),
    accountType: optional("KALPANIK_ACCOUNT_TYPE", "Current Account"),
    ifsc: optional("KALPANIK_IFSC", "HDFC0006825"),
  },
} as const;
