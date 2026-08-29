import { useEffect, useRef, useState } from 'react'

/** Eases a value toward its target so the meter never jumps. */
function useTween(target, ms = 700) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const startRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    fromRef.current = value
    startRef.current = performance.now()

    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / ms)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(fromRef.current + (target - fromRef.current) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ms])

  return value
}

const SWEEP = 260 // degrees of arc
/** Start where the bottom gap ends, so the arc sweeps up through 12 o'clock. */
const START = 180 + (360 - SWEEP) / 2

const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function arcPath(cx, cy, r, fromDeg, toDeg) {
  const [x1, y1] = polar(cx, cy, r, fromDeg)
  const [x2, y2] = polar(cx, cy, r, toDeg)
  const large = toDeg - fromDeg > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

/**
 * Radial live meter for AI likelihood (0..100).
 * `pending` pulses the ring while a segment is being scored.
 */
export default function LiveAiMeter({
  value = null,
  pending = false,
  active = false,
  size = 230,
}) {
  const target = value == null ? 0 : Math.max(0, Math.min(100, value))
  const shown = useTween(target)
  const has = value != null

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 22
  const stroke = 16
  const end = START + (SWEEP * shown) / 100
  const [nx, ny] = polar(cx, cy, r, end)

  const hue = 152 - 152 * (shown / 100)
  const color = `hsl(${hue}, 85%, 58%)`
  const verdict = !has ? 'awaiting audio' : shown >= 50 ? 'AI-Generated' : 'Human'

  return (
    <div className={`ai-meter ${active ? 'active' : ''} ${pending ? 'pending' : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="meterGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(152,85%,55%)" />
            <stop offset="50%" stopColor="hsl(45,92%,58%)" />
            <stop offset="100%" stopColor="hsl(0,85%,60%)" />
          </linearGradient>
          <filter id="meterGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* track */}
        <path
          d={arcPath(cx, cy, r, START, START + SWEEP)}
          fill="none"
          stroke="rgba(148,163,184,0.16)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* faint full-spectrum guide */}
        <path
          d={arcPath(cx, cy, r, START, START + SWEEP)}
          fill="none"
          stroke="url(#meterGrad)"
          strokeWidth={2}
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* value */}
        {has && shown > 0.5 ? (
          <path
            d={arcPath(cx, cy, r, START, end)}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            filter="url(#meterGlow)"
          />
        ) : null}

        {/* 50% divider */}
        <line
          {...(() => {
            const [x1, y1] = polar(cx, cy, r - stroke / 2 - 3, START + SWEEP / 2)
            const [x2, y2] = polar(cx, cy, r + stroke / 2 + 3, START + SWEEP / 2)
            return { x1, y1, x2, y2 }
          })()}
          stroke="rgba(226,232,240,0.45)"
          strokeWidth="2"
        />

        {has ? <circle cx={nx} cy={ny} r={7} fill={color} filter="url(#meterGlow)" /> : null}
      </svg>

      <div className="ai-meter-label">
        <span className="ai-meter-cap">AI likelihood</span>
        <strong style={{ color: has ? color : 'var(--muted)' }}>
          {has ? `${Math.round(shown)}%` : '—'}
        </strong>
        <span className={`ai-meter-verdict ${has ? (shown >= 50 ? 'ai' : 'human') : ''}`}>
          {verdict}
        </span>
      </div>
    </div>
  )
}
