import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, BarChart3, Sigma } from 'lucide-react'
import { computeLiveStats, computeLiveDistribution } from '../utils/metricsCalc.js'

const ACCENT = '#22d3ee'
const AI = '#f43f5e'
const HUMAN = '#34d399'
const WARN = '#fbbf24'
const GRID = 'rgba(148,163,184,0.15)'

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 8,
  fontSize: 12,
}

function LiveStat({ icon: Icon, label, value, unit, tone }) {
  const colors = {
    accent: 'var(--accent)',
    danger: 'var(--danger)',
    success: 'var(--success)',
    warn: 'var(--warn)',
  }
  return (
    <div className="lmp-stat">
      <div className="lmp-stat-icon" style={{ color: colors[tone] || colors.accent }}>
        <Icon size={16} />
      </div>
      <div>
        <span className="lmp-stat-label">{label}</span>
        <span className="lmp-stat-value" style={{ color: colors[tone] || 'var(--text)' }}>
          {value}{unit && <small>{unit}</small>}
        </span>
      </div>
    </div>
  )
}

/**
 * Real-time metrics panel for the live monitor page.
 * Shows rolling stats, distribution histogram, confidence sparkline.
 */
export default function LiveMetricsPanel({ points, scored }) {
  const stats = useMemo(() => computeLiveStats(scored), [scored])
  const distribution = useMemo(() => computeLiveDistribution(scored), [scored])

  const sparkData = useMemo(() => {
    return scored.map((p, i) => ({
      idx: i + 1,
      ai: p.ai,
      confidence: Math.round((p.confidenceScore || 0) * 100),
    }))
  }, [scored])

  // Count segments above/below 50% threshold
  const aboveCount = scored.filter((p) => p.ai >= 50).length
  const belowCount = scored.filter((p) => p.ai < 50).length

  const empty = scored.length === 0

  if (empty) {
    return (
      <div className="card lmp-panel">
        <div className="card-head">
          <h3><BarChart3 size={15} /> Live Session Metrics</h3>
          <p className="muted">Metrics will appear as segments are scored.</p>
        </div>
        <div className="live-chart-empty" style={{ height: 120 }}>
          <div className="scanline" />
          <p className="muted">Waiting for scored segments…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lmp-panel">
      <div className="card-head" style={{ marginBottom: 16 }}>
        <h3><BarChart3 size={15} /> Live Session Metrics</h3>
        <p className="muted">{scored.length} scored segments · real-time analysis</p>
      </div>

      {/* Rolling stats */}
      <div className="lmp-stats-grid">
        <LiveStat icon={TrendingDown} label="Min" value={stats.min} unit="%" tone="success" />
        <LiveStat icon={TrendingUp} label="Max" value={stats.max} unit="%" tone="danger" />
        <LiveStat icon={Activity} label="Mean" value={stats.mean} unit="%" tone="accent" />
        <LiveStat icon={Sigma} label="Median" value={stats.median} unit="%" tone="accent" />
        <LiveStat icon={Activity} label="Std Dev" value={stats.stdDev} unit="%" tone="warn" />
        <LiveStat
          icon={Activity}
          label="Above 50%"
          value={`${aboveCount}/${scored.length}`}
          tone={aboveCount > belowCount ? 'danger' : 'success'}
        />
      </div>

      <div className="lmp-charts-row">
        {/* Distribution histogram */}
        <div className="card chart-card">
          <h5 className="eval-section-title">AI Likelihood Distribution</h5>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distribution} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={1} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((d, i) => {
                  const mid = (i + 0.5) * 10
                  const hue = 152 - 152 * (mid / 100)
                  return <Cell key={i} fill={`hsl(${hue}, 85%, 55%)`} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence sparkline */}
        <div className="card chart-card">
          <h5 className="eval-section-title">AI Likelihood per Segment</h5>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sparkData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="idx" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="ai"
                stroke={AI}
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#e2e8f0' }}
                isAnimationActive
                animationDuration={300}
                name="AI %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
