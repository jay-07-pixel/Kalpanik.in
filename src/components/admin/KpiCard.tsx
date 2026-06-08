import type { CSSProperties } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}

export function KpiCard({ label, value, hint, accent = "#818cf8" }: KpiCardProps) {
  return (
    <div className="admin-kpi" style={{ "--kpi-accent": accent } as CSSProperties}>
      <p className="admin-kpi-label">{label}</p>
      <p className="admin-kpi-value">{value}</p>
      {hint && <p className="admin-kpi-hint">{hint}</p>}
    </div>
  );
}
