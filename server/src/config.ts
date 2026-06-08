import "dotenv/config";

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
    replyTo: optional("MAIL_REPLY_TO", "kalpanik432@gmail.com"),
    notifyTo: optional("ADMIN_NOTIFY_EMAIL", "kalpanik432@gmail.com"),
  },
  admin: {
    email: required("ADMIN_EMAIL"),
    password: required("ADMIN_PASSWORD"),
    jwtSecret: required("JWT_SECRET"),
    jwtExpiresIn: optional("JWT_EXPIRES_IN", "24h"),
  },
} as const;
