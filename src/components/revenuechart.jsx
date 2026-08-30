import { formatUSDC } from "../utils/format";

function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="hint">No revenue data yet for this period.</p>;
  }

  const width = 700;
  const height = 220;
  const padding = 32;
  const maxValue = data.reduce((max, d) => (d.value > max ? d.value : max), 0n);
  const maxNum = Number(maxValue) / 1_000_000 || 1;

  const barWidth = (width - padding * 2) / data.length - 8;

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="revenue-chart">
        {data.map((d, i) => {
          const valueNum = Number(d.value) / 1_000_000;
          const barHeight = (valueNum / maxNum) * (height - padding * 2);
          const x = padding + i * ((width - padding * 2) / data.length);
          const y = height - padding - barHeight;

          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                className="chart-bar"
                rx="3"
              >
                <title>{`${d.label}: ${formatUSDC(d.value)} USDC`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={height - padding + 14}
                textAnchor="middle"
                className="chart-axis-label"
              >
                {d.label.length > 8 ? d.label.slice(5) : d.label}
              </text>
            </g>
          );
        })}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="chart-axis-line"
        />
      </svg>
    </div>
  );
}

export default RevenueChart;