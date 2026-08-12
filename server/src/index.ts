import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { config } from "./config.js";
import { verifyDatabaseConnection } from "./db/pool.js";
import { verifySmtpConnection } from "./services/emailService.js";
import { waitlistRouter } from "./routes/waitlist.js";
import { adminRouter } from "./routes/admin.js";
import { analyticsRouter } from "./routes/analytics.js";
import { renewalsRouter } from "./routes/renewals.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Behind Nginx — required for express-rate-limit + X-Forwarded-For
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: config.corsOrigin.split(",").map((origin) => origin.trim()),
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "kalpanik-api" });
});

app.use("/api/waitlist", waitlistRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/renewals", renewalsRouter);
app.use("/api/admin", adminRouter);
app.use(errorHandler);

async function start() {
  await verifyDatabaseConnection();
  try {
    await verifySmtpConnection();
  } catch (error) {
    console.warn("[smtp] Verify failed — API will still start. Emails may fail until SMTP is fixed:", error);
  }

  app.listen(config.port, "127.0.0.1", () => {
    console.log(`Kalpanik API listening on http://127.0.0.1:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start API server:", error);
  process.exit(1);
});
