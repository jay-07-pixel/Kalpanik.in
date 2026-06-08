import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { verifyDatabaseConnection } from "./db/pool.js";
import { verifySmtpConnection } from "./services/emailService.js";
import { waitlistRouter } from "./routes/waitlist.js";
import { adminRouter } from "./routes/admin.js";
import { analyticsRouter } from "./routes/analytics.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin.split(",").map((origin) => origin.trim()),
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "16kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "kalpanik-api" });
});

app.use("/api/waitlist", waitlistRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/admin", adminRouter);
app.use(errorHandler);

async function start() {
  await verifyDatabaseConnection();
  await verifySmtpConnection();

  app.listen(config.port, () => {
    console.log(`Kalpanik API listening on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start API server:", error);
  process.exit(1);
});
