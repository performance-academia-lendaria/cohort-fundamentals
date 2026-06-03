export default function Constellation() {
  const points = [
    { cx: 8, cy: 18, r: 1.2, op: 0.7 },
    { cx: 22, cy: 8, r: 1.6, op: 0.5 },
    { cx: 38, cy: 24, r: 1.0, op: 0.6 },
    { cx: 55, cy: 12, r: 1.4, op: 0.8 },
    { cx: 72, cy: 28, r: 1.1, op: 0.5 },
    { cx: 88, cy: 15, r: 1.7, op: 0.7 },
    { cx: 14, cy: 62, r: 1.3, op: 0.6 },
    { cx: 32, cy: 78, r: 1.5, op: 0.7 },
    { cx: 48, cy: 85, r: 1.0, op: 0.4 },
    { cx: 64, cy: 70, r: 1.8, op: 0.8 },
    { cx: 82, cy: 88, r: 1.2, op: 0.6 },
    { cx: 92, cy: 55, r: 1.4, op: 0.5 },
    { cx: 6, cy: 40, r: 1.1, op: 0.5 },
    { cx: 28, cy: 45, r: 0.9, op: 0.4 },
    { cx: 58, cy: 50, r: 1.3, op: 0.6 },
  ];

  const lines = [
    [0, 1], [1, 2], [2, 3], [3, 5], [4, 5],
    [6, 7], [7, 8], [8, 9], [9, 10], [11, 10],
    [12, 6], [13, 14], [3, 14],
  ];

  return (
    <svg
      className="constellation"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {lines.map(([a, b], i) => (
        <line
          key={`l-${i}`}
          x1={points[a].cx}
          y1={points[a].cy}
          x2={points[b].cx}
          y2={points[b].cy}
          stroke="rgba(212, 164, 55, 0.15)"
          strokeWidth="0.08"
        />
      ))}
      {points.map((p, i) => (
        <circle
          key={`p-${i}`}
          cx={p.cx}
          cy={p.cy}
          r={p.r * 0.18}
          fill="#F5C76A"
          opacity={p.op}
        />
      ))}
    </svg>
  );
}
