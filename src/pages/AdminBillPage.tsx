import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminApi } from "../constants/admin";
import "../admin.css";

export function AdminBillPage() {
  const { invoiceNo } = useParams<{ invoiceNo: string }>();
  const { token, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !invoiceNo) return;
    if (!token) {
      setError("Sign in to admin first.");
      return;
    }

    let cancelled = false;

    fetch(adminApi(`/renewals/${encodeURIComponent(invoiceNo)}/bill`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? "Failed to load bill");
        }
        const text = await res.text();
        if (!text.trim()) throw new Error("Bill is empty");
        return text;
      })
      .then((text) => {
        if (!cancelled) setHtml(text);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load bill");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, authLoading, invoiceNo]);

  if (authLoading) {
    return <p className="admin-bill-status">Loading…</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-bill-status">
        <p>Sign in to view this invoice.</p>
        <Link to="/admin">Go to admin</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-bill-status admin-bill-status--error">
        <p>{error}</p>
        <Link to="/admin">Back to admin</Link>
      </div>
    );
  }

  if (!html) {
    return <p className="admin-bill-status">Loading invoice…</p>;
  }

  return (
    <iframe
      title={`Invoice ${invoiceNo}`}
      srcDoc={html}
      className="admin-bill-frame"
    />
  );
}
