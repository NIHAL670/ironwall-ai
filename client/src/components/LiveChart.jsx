import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 8,
  fontSize: 12,
}

function LiveTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="live-tip">
      <strong>{p.ai}% AI likelihood</strong>
      <span>
        segment {p.index + 1} · t+{p.t}s
      </span>
      {p.classification ? <span>{p.classification}</span> : null}
    </div>
  )
}

/** Area chart of AI likelihood per segment, filled in as the session runs. */
export default function LiveChart({ points, segmentSeconds }) {
  const data = points.map((p) => ({ ...p, x: p.t }))
  const empty = !points.some((p) => p.ai != null)

  return (
    <div className="card chart-card live-chart">
      <div className="card-head row">
        <div>
          <h3>Live AI likelihood</h3>
          <p className="muted">
            One reading every {segmentSeconds}s · above 50% leans AI-generated
          </p>
        </div>
        <span className="muted">{points.filter((p) => p.ai != null).length} readings</span>
      </div>

      {empty ? (
        <div className="live-chart-empty">
          <div className="scanline" />
          <p className="muted">Waiting for the first segment…</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="aiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.55} />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.12} />
              </linearGradient>
              <linearGradient id="aiStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
            <XAxis
              dataKey="x"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v) => `${v}s`}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<LiveTooltip />} contentStyle={tooltipStyle} />
            <ReferenceLine
              y={50}
              stroke="rgba(226,232,240,0.4)"
              strokeDasharray="4 4"
              label={{ value: 'decision line', fill: '#94a3b8', fontSize: 10, position: 'right' }}
            />
            <Area
              type="monotone"
              dataKey="ai"
              stroke="url(#aiStroke)"
              strokeWidth={2.5}
              fill="url(#aiFill)"
              connectNulls={false}
              isAnimationActive
              animationDuration={450}
              dot={{ r: 3, strokeWidth: 0, fill: '#e2e8f0' }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
