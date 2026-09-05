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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ReferenceLine,
} from 'recharts'

const AI = '#f43f5e'
const HUMAN = '#34d399'
const ACCENT = '#22d3ee'
const GRID = 'rgba(148,163,184,0.15)'
const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 8,
  fontSize: 12,
}

function MetricCard({ label, value, sub, tone }) {
  const colors = {
    danger: 'var(--danger)',
    success: 'var(--success)',
    accent: 'var(--accent)',
    warn: 'var(--warn)',
  }
  return (
    <div className="eval-metric-card">
      <span className="eval-metric-label">{label}</span>
      <span className="eval-metric-value" style={{ color: colors[tone] || 'var(--text)' }}>
        {value}
      </span>
      {sub && <span className="eval-metric-sub">{sub}</span>}
    </div>
  )
}

function SegmentHeatmap({ scores, threshold = 0.58 }) {
  if (!scores?.length) return null
  const th = Number(threshold) || 0.58
  return (
    <div className="eval-heatmap-wrap">
      <div className="eval-heatmap">
        {scores.map((s, i) => {
          const val = Number(s) || 0
          const hue = 152 - 152 * Math.min(1, val)
          const aboveThreshold = val >= th
          return (
            <div
              key={i}
              className={`eval-heatmap-cell ${aboveThreshold ? 'above' : ''}`}
              style={{
                background: `hsla(${hue}, 85%, 55%, 0.85)`,
                boxShadow: aboveThreshold ? `0 0 8px hsla(${hue}, 85%, 55%, 0.4)` : 'none',
              }}
              title={`Segment ${i + 1}: ${(val * 100).toFixed(1)}%${aboveThreshold ? ' (above threshold)' : ''}`}
            />
          )
        })}
      </div>
      <div className="eval-heatmap-legend">
        <span className="muted">0%</span>
        <div className="eval-heatmap-gradient" />
        <span className="muted">100%</span>
        <span className="eval-heatmap-threshold">
          Threshold: {(th * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

function MiniGauge({ value, label, size = 80 }) {
  const v = Math.max(0, Math.min(1, Number(value) || 0))
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c * v
  const hue = 152 * v // red at 0, green at 1
  const color = `hsl(${hue}, 85%, 55%)`

  return (
    <div className="eval-mini-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="eval-mini-gauge-label">
        <strong>{(v * 100).toFixed(0)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

/**
 * Per-sample evaluation metrics panel.
 * Shows after each detection: segment heatmap, metric cards, radar, bar chart.
 */
export default function EvaluationMetrics({ entry }) {
  if (!entry) return null

  const {
    score,
    maxSegmentScore,
    meanSegmentScore,
    segmentsAnalyzed,
    aiRatio,
    strongRatio,
    maxRunRatio,
    threshold,
    segmentScores,
  } = entry

  const hasMetrics = score != null || segmentScores?.length

  const radarData = useMemo(() => {
    if (!hasMetrics) return []
    return [
      { metric: 'AI Ratio', value: (aiRatio || 0) * 100, fullMark: 100 },
      { metric: 'Strong Ratio', value: (strongRatio || 0) * 100, fullMark: 100 },
      { metric: 'Run Ratio', value: (maxRunRatio || 0) * 100, fullMark: 100 },
      { metric: 'Confidence', value: (Number(entry.confidenceScore) || 0) * 100, fullMark: 100 },
      { metric: 'Raw Score', value: (score || 0) * 100, fullMark: 100 },
    ]
  }, [hasMetrics, aiRatio, strongRatio, maxRunRatio, entry.confidenceScore, score])

  const segBarData = useMemo(() => {
    if (!segmentScores?.length) return []
    return segmentScores.map((s, i) => ({
      segment: `S${i + 1}`,
      score: Math.round(s * 100),
    }))
  }, [segmentScores])

  if (!hasMetrics) {
    return (
      <div className="eval-panel">
        <p className="muted" style={{ textAlign: 'center', padding: '12px 0' }}>
          No detailed metrics available for this sample.
        </p>
      </div>
    )
  }

  return (
    <div className="eval-panel">
      <h4 className="eval-panel-title">Evaluation Metrics</h4>

      {/* Metric cards row */}
      <div className="eval-metrics-grid">
        <MetricCard
          label="Raw Score"
          value={score != null ? `${(score * 100).toFixed(1)}%` : '—'}
          tone={score >= (threshold || 0.5) ? 'danger' : 'success'}
        />
        <MetricCard
          label="Max Segment"
          value={maxSegmentScore != null ? `${(maxSegmentScore * 100).toFixed(1)}%` : '—'}
          tone="warn"
        />
        <MetricCard
          label="Mean Segment"
          value={meanSegmentScore != null ? `${(meanSegmentScore * 100).toFixed(1)}%` : '—'}
          tone="accent"
        />
        <MetricCard
          label="Segments"
          value={segmentsAnalyzed ?? '—'}
          sub="analyzed"
        />
        <MetricCard
          label="AI Ratio"
          value={aiRatio != null ? `${(aiRatio * 100).toFixed(1)}%` : '—'}
          sub="above threshold"
          tone="danger"
        />
        <MetricCard
          label="Strong Ratio"
          value={strongRatio != null ? `${(strongRatio * 100).toFixed(1)}%` : '—'}
          sub="high confidence"
          tone="danger"
        />
        <MetricCard
          label="Run Ratio"
          value={maxRunRatio != null ? `${(maxRunRatio * 100).toFixed(1)}%` : '—'}
          sub="max consecutive"
          tone="warn"
        />
        <MetricCard
          label="Threshold"
          value={threshold != null ? `${(threshold * 100).toFixed(0)}%` : '—'}
          sub="decision boundary"
        />
      </div>

      {/* Segment heatmap */}
      {segmentScores?.length > 0 && (
        <div className="eval-section">
          <h5 className="eval-section-title">Segment Score Heatmap</h5>
          <SegmentHeatmap scores={segmentScores} threshold={threshold || 0.5} />
        </div>
      )}

      {/* Charts row */}
      <div className="eval-charts-row">
        {/* Radar */}
        {radarData.length > 0 && (
          <div className="eval-chart-card">
            <h5 className="eval-section-title">Metrics Profile</h5>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke={GRID} />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  axisLine={false}
                />
                <Radar
                  dataKey="value"
                  stroke={AI}
                  fill={AI}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Segment scores bar chart */}
        {segBarData.length > 0 && (
          <div className="eval-chart-card">
            <h5 className="eval-section-title">Segment Scores</h5>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={segBarData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="segment" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine
                  y={(threshold || 0.5) * 100}
                  stroke="rgba(226,232,240,0.5)"
                  strokeDasharray="4 4"
                  label={{ value: 'threshold', fill: '#94a3b8', fontSize: 10, position: 'right' }}
                />
                <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                  {segBarData.map((d, i) => {
                    const hue = 152 - 152 * Math.min(1, (d.score || 0) / 100)
                    return (
                      <Cell key={i} fill={`hsl(${hue}, 85%, 55%)`} />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
