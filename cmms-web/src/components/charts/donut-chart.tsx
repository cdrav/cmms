// Dona de progreso (ej. Programados vs. Realizados) en SVG puro.
export function DonutChart({
  total,
  done,
  color = "#2563eb",
  size = 96,
}: {
  total: number;
  done: number;
  color?: string;
  size?: number;
}) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, done / total) : 0;
  const dash = circumference * ratio;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={10} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="46%" textAnchor="middle" fontSize="18" fontWeight={700} fill="#0f172a">
        {done}
      </text>
      <text x="50%" y="64%" textAnchor="middle" fontSize="10" fill="#64748b">
        de {total}
      </text>
    </svg>
  );
}
