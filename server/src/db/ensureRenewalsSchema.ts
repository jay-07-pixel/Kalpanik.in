import type { Pool, RowDataPacket } from "mysql2/promise";

const COLUMN_DDL: Record<string, string> = {
  contact_person: "ADD COLUMN contact_person VARCHAR(255) DEFAULT NULL AFTER gstin",
  buyer_state: "ADD COLUMN buyer_state VARCHAR(128) DEFAULT NULL AFTER contact_person",
  buyer_state_code: "ADD COLUMN buyer_state_code VARCHAR(8) DEFAULT NULL AFTER buyer_state",
};

interface ColumnRow extends RowDataPacket {
  COLUMN_NAME: string;
}

export async function ensureRenewalsSchema(pool: Pool): Promise<void> {
  const [rows] = await pool.query<ColumnRow[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'renewals'`
  );
  const existing = new Set(rows.map((r) => r.COLUMN_NAME));

  for (const [col, ddl] of Object.entries(COLUMN_DDL)) {
    if (existing.has(col)) continue;
    try {
      await pool.query(`ALTER TABLE renewals ${ddl}`);
      console.log(`[db] Added renewals.${col}`);
    } catch (error) {
      console.warn(`[db] Could not add renewals.${col}:`, error);
    }
  }
}
