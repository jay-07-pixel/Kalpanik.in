/**
 * Legacy CommonJS example — prefer integrations/kalpanikActivate.js (ESM).
 *
 * Install on ALL VPS instances at once:
 *   cd ~/Kalpanik && git pull
 *   bash integrations/install-kalpanik-activate-all.sh
 *
 * Or one instance (e.g. ACS):
 *   bash integrations/install-kalpanik-activate-all.sh acs
 *
 * Manual copy: integrations/kalpanikActivate.js → ~/Task_manager_*/server/
 * Wire in server/src/index.js AFTER app.use(express.json()).
 * Set KALPANIK_ACTIVATION_SECRET in server/.env (same as ~/Kalpanik/.env).
 *
 * Kalpanik admin calls: POST {site}/api/company/subscription/activate
 * Header: X-Kalpanik-Secret
 */

const fs = require("node:fs");
const path = require("node:path");

function registerKalpanikSubscriptionActivate(app) {
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

    // --- Option A: .env file (simple VPS setup) ---
    try {
      const envPath = path.join(process.cwd(), ".env");
      let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
      if (/^COMPANY_TRIAL_END=/m.test(envText)) {
        envText = envText.replace(/^COMPANY_TRIAL_END=.*$/m, `COMPANY_TRIAL_END=${endDate}`);
      } else {
        envText += `\nCOMPANY_TRIAL_END=${endDate}\n`;
      }
      if (/^COMPANY_PLAN=/m.test(envText)) {
        envText = envText.replace(/^COMPANY_PLAN=.*$/m, `COMPANY_PLAN=${plan ?? ""}`);
      } else if (plan) {
        envText += `COMPANY_PLAN=${plan}\n`;
      }
      if (/^COMPANY_MAX_USERS=/m.test(envText)) {
        envText = envText.replace(/^COMPANY_MAX_USERS=.*$/m, `COMPANY_MAX_USERS=${users ?? ""}`);
      } else if (users) {
        envText += `COMPANY_MAX_USERS=${users}\n`;
      }
      fs.writeFileSync(envPath, envText);
      process.env.COMPANY_TRIAL_END = endDate;
      if (plan) process.env.COMPANY_PLAN = String(plan);
      if (users) process.env.COMPANY_MAX_USERS = String(users);
    } catch (err) {
      console.error("[Kalpanik activate] .env update failed:", err);
      return res.status(500).json({ ok: false, error: "Failed to update .env" });
    }

    // --- Option B: update your MySQL company row here if you use DB instead ---

    console.log(
      `[Kalpanik] Subscription activated instance=${instance} invoice=${invoiceNo} until=${endDate} plan=${plan} users=${users} months=${months} extraGb=${extraGb} amount=${amountInr}`
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
    });
  });
}

module.exports = { registerKalpanikSubscriptionActivate };

// Usage in server/index.js:
// const { registerKalpanikSubscriptionActivate } = require("./routes/kalpanikActivate");
// registerKalpanikSubscriptionActivate(app);
