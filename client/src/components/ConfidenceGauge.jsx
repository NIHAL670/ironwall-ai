// Radial gauge showing a 0..1 confidence value.
export default function ConfidenceGauge({ value = 0, ai = false, size = 168 }) {
  const v = Math.max(0, Math.min(1, Number(value) || 0))
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c * v
  const color = ai ? 'var(--danger)' : 'var(--success)'

  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="gauge-label">
        <strong>{Math.round(v * 100)}%</strong>
        <span>confidence</span>
      </div>
    </div>
  )
}
