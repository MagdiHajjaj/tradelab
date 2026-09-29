import { series } from "@/lib/simulation";

export function PriceChart({
  seed,
  compact = false,
  negative = false,
}: {
  seed: number;
  compact?: boolean;
  negative?: boolean;
}) {
  const values = series(seed, compact ? 25 : 92);
  const width = compact ? 120 : 900;
  const height = compact ? 35 : 260;
  const min = Math.min(...values) - 0.8;
  const max = Math.max(...values) + 0.8;
  const points = values.map((v, i) => [
    (i * width) / (values.length - 1),
    height - ((v - min) / (max - min)) * (height - 24) - 12,
  ]);
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const color = negative ? "#f18e8e" : "#b9f56b";
  const gradient = `chart-${seed}-${compact ? "small" : "large"}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={compact ? "sparkline" : "price-chart"}
      role="img"
      aria-label="Illustrative simulated price history"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".19" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {!compact &&
        [35, 90, 145, 200, 255].map((y) => (
          <line
            key={y}
            x1="0"
            x2={width}
            y1={y}
            y2={y}
            stroke="#ffffff"
            strokeOpacity=".055"
            strokeDasharray="3 5"
          />
        ))}
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={`url(#${gradient})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={compact ? 1.8 : 2.4}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      {!compact && <circle cx={points.at(-1)![0] - 4} cy={points.at(-1)![1]} r="4" fill={color} />}
    </svg>
  );
}
