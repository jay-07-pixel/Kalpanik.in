import type { ResultSetHeader } from "mysql2";
import { pool } from "../db/pool.js";
import { normalizeEmail } from "../utils/validateEmail.js";

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email already registered");
    this.name = "DuplicateEmailError";
  }
}

export async function addToWaitlist(email: string): Promise<{ id: number; email: string }> {
  const normalized = normalizeEmail(email);

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO waitlist (email) VALUES (?)",
      [normalized]
    );

    return { id: result.insertId, email: normalized };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      throw new DuplicateEmailError();
    }
    throw error;
  }
}
