// Gráfico de barras simple en SVG puro — sin librería externa, renderiza en el servidor.
type Bar = { label: string; value: number; color: string };

export function BarChart({ bars, height = 120 }: { bars: Bar[]; height?: number }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const barWidth = 48;
  const gap = 24;
  const width = bars.length * (barWidth + gap);

  return (
    <div>
      <svg width={width} height={height + 24} viewBox={`0 0 ${width} ${height + 24}`}>
        {bars.map((bar, i) => {
          const barHeight = (bar.value / max) * height;
          const x = i * (barWidth + gap) + gap / 2;
          return (
            <g key={bar.label}>
              <rect x={x} y={height - barHeight} width={barWidth} height={barHeight} fill={bar.color} rx={2} />
              <text x={x + barWidth / 2} y={height - barHeight - 6} textAnchor="middle" fontSize="12" fontWeight={600} fill="#0f172a">
                {bar.value}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex text-xs text-slate-500" style={{ width }}>
        {bars.map((bar) => (
          <div key={bar.label} style={{ width: barWidth + gap }} className="text-center">
            {bar.label}
          </div>
        ))}
      </div>
    </div>
  );
}
