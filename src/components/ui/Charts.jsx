// src/components/ui/Charts.jsx
// Gráficos SVG puros — sem dependências externas

// ── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// ── BarChart ─────────────────────────────────────────────────────────────────
// data: [{ label, value, color? }]
export function BarChart({ data, height = 160, color = 'var(--blue)', showValues = true, formatValue = (v) => v }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = 100 / data.length;
  const gap = barW * 0.25;

  return (
    <svg viewBox={`0 0 100 ${height + 24}`} width="100%" style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const bh = clamp((d.value / max) * height, 2, height);
        const x = i * barW + gap / 2;
        const w = barW - gap;
        const y = height - bh;
        const c = d.color || color;
        return (
          <g key={i}>
            {/* Background bar */}
            <rect x={x} y={0} width={w} height={height} rx="3" fill="rgba(255,255,255,0.04)" />
            {/* Value bar */}
            <rect x={x} y={y} width={w} height={bh} rx="3" fill={c} opacity="0.85" />
            {/* Label */}
            <text
              x={x + w / 2} y={height + 14}
              textAnchor="middle" fill="rgba(245,240,232,0.35)"
              fontSize="5" fontFamily="JetBrains Mono, monospace"
            >
              {d.label}
            </text>
            {/* Value on hover (always shown if showValues) */}
            {showValues && d.value > 0 && (
              <text
                x={x + w / 2} y={y - 3}
                textAnchor="middle" fill={c}
                fontSize="4.5" fontFamily="JetBrains Mono, monospace" opacity="0.8"
              >
                {formatValue(d.value)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── AreaChart ─────────────────────────────────────────────────────────────────
// data: number[]  labels: string[]
export function AreaChart({ data, labels, height = 100, color = 'var(--blue)', width = 300 }) {
  if (!data?.length || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pad = 8;
  const uw = (width - pad * 2) / (data.length - 1);

  const pts = data.map((v, i) => ({
    x: pad + i * uw,
    y: pad + ((max - v) / range) * (height - pad * 2),
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height + 16}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`areaGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad} y1={pad + t * (height - pad * 2)}
          x2={width - pad} y2={pad + t * (height - pad * 2)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"
        />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill={`url(#areaGrad-${color.replace('#', '')})`} />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} stroke="#0D0D0F" strokeWidth="1.5" />
      ))}
      {/* Labels */}
      {labels && labels.map((l, i) => (
        <text
          key={i} x={pts[i]?.x} y={height + 14}
          textAnchor="middle" fill="rgba(245,240,232,0.3)"
          fontSize="5" fontFamily="JetBrains Mono, monospace"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────
// segments: [{ label, value, color }]
export function DonutChart({ segments, size = 140, thickness = 22, centerLabel, centerSub }) {
  if (!segments?.length) return null;
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const arc = { ...seg, dash, gap, offset, pct };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {arcs.map((arc, i) => (
          <circle
            key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={arc.color} strokeWidth={thickness - 2}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="round"
          />
        ))}
        {/* Center text (counter-rotate) */}
        {centerLabel && (
          <text
            x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle"
            fill="#F5F0E8" fontSize="14" fontWeight="700" fontFamily="Syne, sans-serif"
            style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
          >
            {centerLabel}
          </text>
        )}
        {centerSub && (
          <text
            x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(245,240,232,0.4)" fontSize="6" fontFamily="JetBrains Mono, monospace"
            style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
          >
            {centerSub}
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-cream/50 truncate flex-1">{seg.label}</span>
            <span className="font-mono text-cream/40 shrink-0">{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
