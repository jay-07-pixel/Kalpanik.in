import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";

export interface AdminTokenPayload {
  sub: string;
  role: "admin";
}

export function validateAdminCredentials(email: string, password: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== config.admin.email.toLowerCase()) return false;
  return password === config.admin.password;
}

export function issueAdminToken(email: string): string {
  const payload: AdminTokenPayload = {
    sub: email.trim().toLowerCase(),
    role: "admin",
  };
  const options: SignOptions = {
    expiresIn: config.admin.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.admin.jwtSecret, options);
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.admin.jwtSecret) as AdminTokenPayload;
    if (decoded.role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}
