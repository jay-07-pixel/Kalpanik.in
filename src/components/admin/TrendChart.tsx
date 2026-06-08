interface TrendChartProps {
  title: string;
  data: { date: string; count: number }[];
  color?: string;
}

function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function TrendChart({ title, data, color = "#a78bfa" }: TrendChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const width = 100;
  const height = 48;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
    const y = height - (d.count / max) * height;
    return `${x},${y}`;
  });

  return (
    <div className="admin-chart-card">
      <h3 className="admin-chart-title">{title}</h3>
      {data.length === 0 ? (
        <p className="admin-empty">No data yet</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="admin-trend-svg" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={points.join(" ")}
            />
          </svg>
          <div className="admin-trend-labels">
            {data.length <= 7
              ? data.map((d) => <span key={d.date}>{formatDate(d.date)}</span>)
              : [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].map((d) => (
                  <span key={d.date}>{formatDate(d.date)}</span>
                ))}
          </div>
        </>
      )}
    </div>
  );
}
