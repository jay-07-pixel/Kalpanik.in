export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";

export function parseDeviceType(ua: string): DeviceType {
  const lower = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk/i.test(lower)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(lower)) return "mobile";
  if (lower) return "desktop";
  return "unknown";
}

export function parseBrowser(ua: string): string {
  if (!ua) return "Unknown";
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return "Safari";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/msie|trident/i.test(ua)) return "IE";
  return "Other";
}

export function parseTrafficSource(referrer: string | null): string {
  if (!referrer?.trim()) return "direct";
  const lower = referrer.toLowerCase();
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|baidu\./i.test(lower)) return "search";
  if (/facebook\.|twitter\.|x\.com|instagram\.|linkedin\.|t\.co|whatsapp\./i.test(lower)) return "social";
  if (lower.includes("kalpanik.in")) return "internal";
  return "referral";
}

export function parseCountry(headers: Record<string, string | string[] | undefined>): string | null {
  const candidates = [
    headers["cf-ipcountry"],
    headers["x-country"],
    headers["x-vercel-ip-country"],
  ];
  for (const value of candidates) {
    const code = Array.isArray(value) ? value[0] : value;
    if (code && code !== "XX" && code.length <= 64) return code.toUpperCase();
  }
  return null;
}
