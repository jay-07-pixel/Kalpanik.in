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

export function registerKalpanikSubscriptionActivate(app) {
  app.post("/api/company/subscription/activate", async (req, res) => {
    const secret = process.env.KALPANIK_ACTIVATION_SECRET;
    if (!secret || req.headers["x-kalpanik-secret"] !== secret) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

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
