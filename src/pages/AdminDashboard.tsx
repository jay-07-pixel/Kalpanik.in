import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KpiCard } from "../components/admin/KpiCard";
import { BarChart } from "../components/admin/BarChart";
import { TrendChart } from "../components/admin/TrendChart";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminApi } from "../constants/admin";
import "../admin.css";

interface DashboardData {
  visitors: {
    total: number;
    unique: number;
    today: number;
    week: number;
    month: number;
  };
  waitlist: {
    total: number;
    latest: { id: number; email: string; createdAt: string }[];
    trend: { date: string; count: number }[];
  };
  website: {
    deviceBreakdown: { label: string; count: number }[];
    browserBreakdown: { label: string; count: number }[];
    countryBreakdown: { label: string; count: number }[];
    trafficSources: { label: string; count: number }[];
    visitTrend: { date: string; count: number }[];
  };
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { token, isAuthenticated, isLoading, logout } = useAdminAuth();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !token) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, token, navigate]);

  useEffect(() => {
    if (!token || isLoading) return;

    let cancelled = false;

    fetch(adminApi("/stats"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          logout();
          navigate("/", { replace: true });
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        if (!data.success) {
          setError(data.message ?? "Failed to load stats.");
          return;
        }
        setStats(data.data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, isLoading, logout, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="admin-shell admin-loading">
        <div className="admin-spinner" />
        <p>Verifying access…</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Founder Dashboard</p>
          <h1>Kalpanik Command Center</h1>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="admin-btn-ghost" onClick={() => navigate("/")}>
            View Site
          </button>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {loadingStats && (
        <div className="admin-loading-inline">
          <div className="admin-spinner" />
          <span>Loading analytics…</span>
        </div>
      )}

      {error && <p className="admin-error-banner">{error}</p>}

      {stats && (
        <>
          <section className="admin-section">
            <h2 className="admin-section-title">Visitors</h2>
            <div className="admin-kpi-grid">
              <KpiCard label="Total visits" value={stats.visitors.total} accent="#38bdf8" />
              <KpiCard label="Unique visitors" value={stats.visitors.unique} accent="#818cf8" />
              <KpiCard label="Today" value={stats.visitors.today} accent="#34d399" />
              <KpiCard label="This week" value={stats.visitors.week} accent="#fbbf24" />
              <KpiCard label="This month" value={stats.visitors.month} accent="#f472b6" />
            </div>
            <div className="admin-charts-grid">
              <TrendChart title="Visit trend (14 days)" data={stats.website.visitTrend} color="#38bdf8" />
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section-title">Waitlist</h2>
            <div className="admin-kpi-grid admin-kpi-grid--compact">
              <KpiCard label="Total signups" value={stats.waitlist.total} accent="#a78bfa" />
            </div>
            <div className="admin-charts-grid admin-charts-grid--2">
              <TrendChart title="Signup trend (30 days)" data={stats.waitlist.trend} color="#a78bfa" />
              <div className="admin-chart-card">
                <h3 className="admin-chart-title">Latest signups</h3>
                {stats.waitlist.latest.length === 0 ? (
                  <p className="admin-empty">No signups yet</p>
                ) : (
                  <ul className="admin-signup-list">
                    {stats.waitlist.latest.map((row) => (
                      <li key={row.id}>
                        <span className="admin-signup-email">{row.email}</span>
                        <span className="admin-signup-date">{formatDateTime(row.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section-title">Website Stats</h2>
            <div className="admin-charts-grid admin-charts-grid--2">
              <BarChart title="Device breakdown" data={stats.website.deviceBreakdown} color="#38bdf8" />
              <BarChart title="Browser breakdown" data={stats.website.browserBreakdown} color="#818cf8" />
              <BarChart title="Top countries" data={stats.website.countryBreakdown} color="#34d399" />
              <BarChart title="Traffic sources" data={stats.website.trafficSources} color="#fbbf24" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
