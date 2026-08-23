/**
 * Kalpanik subscription webhook for Task Manager (ES modules).
 *
 * Install on each VPS instance: Task_manager, Task_manager_acs, …
 * Register AFTER app.use(express.json()) in server/src/index.js:
 *
 *   import { registerKalpanikSubscriptionActivate } from "../kalpanikActivate.js";
 *   registerKalpanikSubscriptionActivate(app);
 *
 * Set KALPANIK_ACTIVATION_SECRET in server/.env (same as ~/Kalpanik/.env).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function upsertEnvLine(envText, key, value) {
  const re = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  if (re.test(envText)) return envText.replace(re, line);
  return `${envText.trimEnd()}\n${line}\n`;
}

function dirSizeBytes(dir, depth = 0) {
  if (depth > 12 || !fs.existsSync(dir)) return 0;
  let total = 0;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    try {
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
          continue;
        }
        total += dirSizeBytes(full, depth + 1);
      } else if (entry.isFile()) {
        total += fs.statSync(full).size;
      }
    } catch {
      /* skip unreadable */
    }
  }
  return total;
}

/** Sum upload/media folders used by Task Manager (company-wide total). */
function measureCompanyStorageBytes() {
  const candidates = [
    path.join(__dirname, "uploads"),
    path.join(__dirname, "upload"),
    path.join(__dirname, "storage"),
    path.join(__dirname, "media"),
    path.join(__dirname, "public", "uploads"),
    path.join(__dirname, "..", "uploads"),
    path.join(__dirname, "..", "upload"),
    path.join(__dirname, "..", "storage"),
    path.join(__dirname, "..", "client", "uploads"),
    path.join(__dirname, "..", "client", "public", "uploads"),
  ];

  let total = 0;
  const seen = new Set();
  for (const dir of candidates) {
    const resolved = path.resolve(dir);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    if (fs.existsSync(resolved)) total += dirSizeBytes(resolved);
  }
  return total;
}

async function countEmployeesFromDb() {
  try {
    const mysql = await import("mysql2/promise");
    const host = process.env.DB_HOST || process.env.MYSQL_HOST || "127.0.0.1";
    const user = process.env.DB_USER || process.env.MYSQL_USER;
    const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "";
    const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;
    if (!user || !database) return null;

    const conn = await mysql.createConnection({
      host,
      port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
      user,
      password,
      database,
    });
    try {
      // Try common user-table shapes used by Task Manager forks
      const queries = [
        "SELECT COUNT(*) AS c FROM users WHERE deleted_at IS NULL",
        "SELECT COUNT(*) AS c FROM users WHERE is_active = 1",
        "SELECT COUNT(*) AS c FROM users",
        "SELECT COUNT(*) AS c FROM employees WHERE deleted_at IS NULL",
        "SELECT COUNT(*) AS c FROM employees",
      ];
      for (const sql of queries) {
        try {
          const [rows] = await conn.query(sql);
          const c = Number(rows?.[0]?.c);
          if (Number.isFinite(c)) return c;
        } catch {
          /* try next */
        }
      }
    } finally {
      await conn.end().catch(() => {});
    }
  } catch {
    /* mysql not available / misconfigured */
  }
  return null;
}

export function registerKalpanikSubscriptionActivate(app) {
  function checkSecret(req, res) {
    const secret = process.env.KALPANIK_ACTIVATION_SECRET;
    if (!secret || req.headers["x-kalpanik-secret"] !== secret) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return false;
    }
    return true;
  }

  app.get("/api/company/subscription/status", async (req, res) => {
    if (!checkSecret(req, res)) return;

    const trialEnd = process.env.COMPANY_TRIAL_END?.trim()?.slice(0, 10) || null;
    const plan = process.env.COMPANY_PLAN?.trim() || null;
    const maxUsers = process.env.COMPANY_MAX_USERS?.trim() || null;

    let storageUsedBytes = measureCompanyStorageBytes();
    const envStorageGb = process.env.COMPANY_STORAGE_USED_GB?.trim();
    if (envStorageGb && Number(envStorageGb) > 0 && storageUsedBytes <= 0) {
      storageUsedBytes = Number(envStorageGb) * 1024 * 1024 * 1024;
    }

    const storageUsedGb =
      storageUsedBytes > 0
        ? Math.round((storageUsedBytes / (1024 * 1024 * 1024)) * 1000) / 1000
        : 0;
    const storageUsedMb =
      storageUsedBytes > 0
        ? Math.round((storageUsedBytes / (1024 * 1024)) * 10) / 10
        : 0;

    let employeeCount = process.env.COMPANY_EMPLOYEE_COUNT?.trim()
      ? Number(process.env.COMPANY_EMPLOYEE_COUNT)
      : null;
    if (employeeCount === null || Number.isNaN(employeeCount)) {
      employeeCount = await countEmployeesFromDb();
    }

    return res.json({
      ok: true,
      trialEnd,
      plan,
      maxUsers: maxUsers ? Number(maxUsers) : null,
      employeeCount: employeeCount != null && Number.isFinite(employeeCount) ? employeeCount : null,
      storageUsedBytes,
      storageUsedMb,
      storageUsedGb,
    });
  });

  app.post("/api/company/subscription/activate", async (req, res) => {
    if (!checkSecret(req, res)) return;

    const {
      instance,
      invoiceNo,
      plan,
      users,
      months,
      extraGb,
      trialEndExtendTo,
      amountInr,
    } = req.body ?? {};

    if (!trialEndExtendTo) {
      return res.status(400).json({ ok: false, error: "trialEndExtendTo required" });
    }

    const endDate = String(trialEndExtendTo).slice(0, 10);
    const envPath = path.join(__dirname, ".env");

    try {
      let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
      envText = upsertEnvLine(envText, "COMPANY_TRIAL_END", endDate);
      if (plan) envText = upsertEnvLine(envText, "COMPANY_PLAN", String(plan));
      if (users) envText = upsertEnvLine(envText, "COMPANY_MAX_USERS", String(users));
      fs.writeFileSync(envPath, envText);
      process.env.COMPANY_TRIAL_END = endDate;
      if (plan) process.env.COMPANY_PLAN = String(plan);
      if (users) process.env.COMPANY_MAX_USERS = String(users);
    } catch (err) {
      console.error("[Kalpanik activate] .env update failed:", err);
      return res.status(500).json({ ok: false, error: "Failed to update .env" });
    }

    console.log(
      `[Kalpanik] Activated instance=${instance} invoice=${invoiceNo} until=${endDate} plan=${plan} users=${users} months=${months} extraGb=${extraGb} amount=${amountInr}`
    );

    return res.json({
      ok: true,
      instance,
      invoiceNo,
      trialEnd: endDate,
      plan,
      users,
      months,
      extraGb,
      amountInr,
    });
  });
}
