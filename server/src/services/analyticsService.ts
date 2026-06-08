import type { RowDataPacket } from "mysql2";
import { pool } from "../db/pool.js";
import {
  parseBrowser,
  parseCountry,
  parseDeviceType,
  parseTrafficSource,
} from "../utils/userAgent.js";

interface CountRow extends RowDataPacket {
  count: number;
}

interface LabelCountRow extends RowDataPacket {
  label: string;
  count: number;
}

interface TrendRow extends RowDataPacket {
  date: string;
  count: number;
}

interface WaitlistRow extends RowDataPacket {
  id: number;
  email: string;
  created_at: Date;
}

export interface TrackVisitInput {
  visitorId: string;
  path?: string;
  referrer?: string | null;
  userAgent?: string;
  headers?: Record<string, string | string[] | undefined>;
}

export async function trackVisit(input: TrackVisitInput): Promise<void> {
  const ua = input.userAgent ?? "";
  const referrer = input.referrer?.trim() || null;

  await pool.execute(
    `INSERT INTO page_visits
      (visitor_id, device_type, browser, country, referrer, traffic_source, path, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.visitorId,
      parseDeviceType(ua),
      parseBrowser(ua),
      parseCountry(input.headers ?? {}),
      referrer,
      parseTrafficSource(referrer),
      input.path?.trim() || "/",
      ua.slice(0, 512) || null,
    ]
  );
}

async function countVisits(where = "", params: unknown[] = []): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS count FROM page_visits ${where}`,
    params
  );
  return Number(rows[0]?.count ?? 0);
}

async function countUniqueVisitors(where = "", params: unknown[] = []): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(DISTINCT visitor_id) AS count FROM page_visits ${where}`,
    params
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getDashboardStats() {
  const [
    totalVisits,
    uniqueVisitors,
    visitsToday,
    visitsWeek,
    visitsMonth,
    waitlistTotal,
    latestSignups,
    waitlistTrend,
    deviceBreakdown,
    browserBreakdown,
    countryBreakdown,
    trafficSources,
    visitTrend,
  ] = await Promise.all([
    countVisits(),
    countUniqueVisitors(),
    countVisits("WHERE DATE(created_at) = CURDATE()"),
    countVisits("WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
    countVisits("WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"),
    pool.query<CountRow[]>("SELECT COUNT(*) AS count FROM waitlist").then(([r]) => Number(r[0]?.count ?? 0)),
    pool.query<WaitlistRow[]>(
      "SELECT id, email, created_at FROM waitlist ORDER BY created_at DESC LIMIT 20"
    ).then(([r]) => r),
    pool.query<TrendRow[]>(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM waitlist
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    ).then(([r]) => r),
    pool.query<LabelCountRow[]>(
      `SELECT device_type AS label, COUNT(*) AS count
       FROM page_visits GROUP BY device_type ORDER BY count DESC`
    ).then(([r]) => r),
    pool.query<LabelCountRow[]>(
      `SELECT browser AS label, COUNT(*) AS count
       FROM page_visits GROUP BY browser ORDER BY count DESC LIMIT 8`
    ).then(([r]) => r),
    pool.query<LabelCountRow[]>(
      `SELECT COALESCE(country, 'Unknown') AS label, COUNT(*) AS count
       FROM page_visits GROUP BY country ORDER BY count DESC LIMIT 10`
    ).then(([r]) => r),
    pool.query<LabelCountRow[]>(
      `SELECT traffic_source AS label, COUNT(*) AS count
       FROM page_visits GROUP BY traffic_source ORDER BY count DESC`
    ).then(([r]) => r),
    pool.query<TrendRow[]>(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM page_visits
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    ).then(([r]) => r),
  ]);

  return {
    visitors: {
      total: totalVisits,
      unique: uniqueVisitors,
      today: visitsToday,
      week: visitsWeek,
      month: visitsMonth,
    },
    waitlist: {
      total: waitlistTotal,
      latest: latestSignups.map((row) => ({
        id: row.id,
        email: row.email,
        createdAt: row.created_at,
      })),
      trend: waitlistTrend.map((row) => ({
        date: row.date,
        count: Number(row.count),
      })),
    },
    website: {
      deviceBreakdown: deviceBreakdown.map((r) => ({
        label: r.label,
        count: Number(r.count),
      })),
      browserBreakdown: browserBreakdown.map((r) => ({
        label: r.label,
        count: Number(r.count),
      })),
      countryBreakdown: countryBreakdown.map((r) => ({
        label: r.label,
        count: Number(r.count),
      })),
      trafficSources: trafficSources.map((r) => ({
        label: r.label,
        count: Number(r.count),
      })),
      visitTrend: visitTrend.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
    },
  };
}
