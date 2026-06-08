interface BarChartProps {
  title: string;
  data: { label: string; count: number }[];
  color?: string;
}

export function BarChart({ title, data, color = "#38bdf8" }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="admin-chart-card">
      <h3 className="admin-chart-title">{title}</h3>
      {data.length === 0 ? (
        <p className="admin-empty">No data yet</p>
      ) : (
        <ul className="admin-bar-chart">
          {data.map((item) => (
            <li key={item.label} className="admin-bar-row">
              <span className="admin-bar-label">{item.label}</span>
              <div className="admin-bar-track">
                <div
                  className="admin-bar-fill"
                  style={{ width: `${(item.count / max) * 100}%`, background: color }}
                />
              </div>
              <span className="admin-bar-value">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
