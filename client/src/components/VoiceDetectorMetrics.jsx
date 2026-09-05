import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts'
import {
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingUp,
  Activity,
  Layers,
  AlertTriangle,
  Tag,
  HelpCircle,
  BarChart3,
  Sliders,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'
import {
  getLabeledItems,
  computeConfusionMatrix,
  computeConfusionMatrixByScore,
  computePrecision,
  computeRecall,
  computeSpecificity,
  computeAccuracy,
  computeF1,
  computeROCCurve,
  computeAUC,
  computeEER,
  computeDETCurve,
  computeLiveModelStats,
  computeScoreDistribution,
  computeThresholdSensitivity,
  computeLanguageBreakdown,
  computeScoreTimeline,
} from '../utils/metricsCalc.js'
import { useHistory } from '../hooks/useHistory.jsx'
import { pct, isAi } from '../utils/format.js'

const AI = '#f43f5e'
const HUMAN = '#34d399'
const ACCENT = '#22d3ee'
const WARN = '#fbbf24'
const GRID = 'rgba(148,163,184,0.15)'

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 8,
  fontSize: 12,
}

function MiniMetricCard({ icon: Icon, label, value, sub, tone }) {
  const colors = {
    accent: 'var(--accent)',
    danger: 'var(--danger)',
    success: 'var(--success)',
    warn: 'var(--warn)',
  }
  return (
    <div className="vdm-stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={14} style={{ color: colors[tone] || 'var(--muted)' }} />}
        <span className="vdm-stat-label">{label}</span>
      </div>
      <span className="vdm-stat-value" style={{ color: colors[tone] || 'var(--text)' }}>
        {value}
      </span>
      {sub && <span className="vdm-stat-sub">{sub}</span>}
    </div>
  )
}

function ConfusionMatrixViz({ cm }) {
  const total = cm.tp + cm.tn + cm.fp + cm.fn || 1
  const cells = [
    { label: 'TP (True AI)', value: cm.tp, row: 'AI', col: 'AI', tone: 'success' },
    { label: 'FP (False AI)', value: cm.fp, row: 'Human', col: 'AI', tone: 'danger' },
    { label: 'FN (Missed AI)', value: cm.fn, row: 'AI', col: 'Human', tone: 'warn' },
    { label: 'TN (True Human)', value: cm.tn, row: 'Human', col: 'Human', tone: 'success' },
  ]

  return (
    <div className="vdm-cm">
      <div className="vdm-cm-header">
        <span />
        <span className="vdm-cm-col-label">Pred: AI</span>
        <span className="vdm-cm-col-label">Pred: Human</span>
      </div>
      <div className="vdm-cm-row">
        <span className="vdm-cm-row-label">Actual: AI</span>
        {cells.slice(0, 2).map((c) => (
          <div
            key={c.label}
            className={`vdm-cm-cell ${c.tone}`}
            style={{ opacity: 0.45 + 0.55 * (c.value / total) }}
          >
            <strong>{c.value}</strong>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
      <div className="vdm-cm-row">
        <span className="vdm-cm-row-label">Actual: Human</span>
        {cells.slice(2).map((c) => (
          <div
            key={c.label}
            className={`vdm-cm-cell ${c.tone}`}
            style={{ opacity: 0.45 + 0.55 * (c.value / total) }}
          >
            <strong>{c.value}</strong>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VoiceDetectorMetrics() {
  const { items, setGroundTruth, clearAllGroundTruth } = useHistory()
  const [threshold, setThreshold] = useState(0.58)
  const [activeTab, setActiveTab] = useState('live') // 'live' | 'benchmark'
  const [justUpdated, setJustUpdated] = useState(false)

  const flashUpdate = () => {
    setJustUpdated(true)
    setTimeout(() => setJustUpdated(false), 1400)
  }

  // 100% Real Live Model Stats across all real inferences
  const liveStats = useMemo(() => computeLiveModelStats(items), [items])
  const scoreDist = useMemo(() => computeScoreDistribution(items), [items])
  const { curve: sensitivityCurve, current: sensitivityCurrent } = useMemo(
    () => computeThresholdSensitivity(items, threshold),
    [items, threshold]
  )
  const langBreakdown = useMemo(() => computeLanguageBreakdown(items), [items])
  const scoreTimeline = useMemo(() => computeScoreTimeline(items), [items])

  // Ground-truth benchmark metrics (Strictly on labeled samples)
  const labeledItems = useMemo(() => getLabeledItems(items), [items])
  const hasLabels = labeledItems.length > 0
  const hasBothClasses =
    labeledItems.some((x) => x.groundTruth === 'ai') &&
    labeledItems.some((x) => x.groundTruth === 'human')

  const cm = useMemo(() => computeConfusionMatrix(items), [items])
  const cmByScore = useMemo(
    () => computeConfusionMatrixByScore(items, threshold),
    [items, threshold]
  )

  const accuracy = computeAccuracy(cm)
  const precision = computePrecision(cm)
  const recall = computeRecall(cm)
  const specificity = computeSpecificity(cm)
  const f1 = computeF1(cm)

  const rocCurve = useMemo(() => computeROCCurve(items), [items])
  const auc = useMemo(() => computeAUC(rocCurve), [rocCurve])
  const { eer, eerThreshold } = useMemo(() => computeEER(items), [items])
  const detCurve = useMemo(() => computeDETCurve(items), [items])

  const empty = items.length === 0

  if (empty) {
    return (
      <div className="card empty muted" style={{ padding: 48, textAlign: 'center' }}>
        <Activity size={32} style={{ margin: '0 auto 12px', color: 'var(--accent)' }} />
        <h3>No Scanned Audio Yet</h3>
        <p className="muted" style={{ maxWidth: 460, margin: '8px auto 0' }}>
          Upload an audio file or run the live microphone monitor to generate real inference telemetry and live evaluation metrics.
        </p>
      </div>
    )
  }

  return (
    <div className="vdm-dashboard">
      {/* Top Navigation Tabs */}
      <div className="vdm-tabs-row" style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <button
          className={`btn ${activeTab === 'live' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('live')}
        >
          <Activity size={15} /> Live Model Operational Analytics ({items.length} scans)
        </button>
        <button
          className={`btn ${activeTab === 'benchmark' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('benchmark')}
        >
          <Target size={15} /> Ground Truth Benchmark {hasLabels ? `(${labeledItems.length} labeled)` : '(0 labeled)'}
        </button>
      </div>

      {activeTab === 'live' && (
        <>
          {/* Real Operational Telemetry Stat Cards */}
          <div className="vdm-stat-row">
            <MiniMetricCard
              icon={Activity}
              label="Total Scans"
              value={liveStats.total}
              sub={`${liveStats.aiCount} AI · ${liveStats.humanCount} Human`}
              tone="accent"
            />
            <MiniMetricCard
              icon={ShieldAlert}
              label="AI Detection Rate"
              value={`${liveStats.aiRate.toFixed(1)}%`}
              sub="of processed audio"
              tone={liveStats.aiRate > 50 ? 'danger' : 'accent'}
            />
            <MiniMetricCard
              icon={TrendingUp}
              label="Mean Model Score"
              value={`${liveStats.meanScore.toFixed(1)}%`}
              sub={`Range: ${liveStats.minScore.toFixed(0)}% – ${liveStats.maxScore.toFixed(0)}%`}
              tone="accent"
            />
            <MiniMetricCard
              icon={Sparkles}
              label="Avg. AI Confidence"
              value={liveStats.avgAiConfidence ? `${liveStats.avgAiConfidence.toFixed(1)}%` : '—'}
              sub={`Human: ${liveStats.avgHumanConfidence.toFixed(1)}%`}
              tone="success"
            />
            <MiniMetricCard
              icon={Layers}
              label="Avg. AI Segment Ratio"
              value={`${liveStats.avgAiRatio.toFixed(1)}%`}
              sub="audio segment coverage"
              tone="warn"
            />
            <MiniMetricCard
              icon={AlertTriangle}
              label="Borderline Margin"
              value={`${liveStats.borderlineRate.toFixed(1)}%`}
              sub={`${liveStats.borderlineCount} scans near boundary`}
              tone={liveStats.borderlineCount > 0 ? 'warn' : 'success'}
            />
          </div>

          {/* Deepfake Segment Dynamics */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
            <div className="card-head">
              <div>
                <h3><Layers size={16} /> Real Segment-Level Deepfake Telemetry</h3>
                <p className="muted">
                  Averaged across real inference runs: measures synthetic coverage, high-confidence bursts, and temporal consistency.
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 12 }}>
              <div style={{ background: 'var(--card-2)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block' }}>Synthetic Segment Coverage</span>
                <strong style={{ fontSize: 20, color: 'var(--danger)', display: 'block', margin: '4px 0' }}>
                  {liveStats.avgAiRatio.toFixed(1)}%
                </strong>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Portion of audio with score ≥ threshold</span>
              </div>
              <div style={{ background: 'var(--card-2)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block' }}>Strong Anomaly Ratio</span>
                <strong style={{ fontSize: 20, color: 'var(--warn)', display: 'block', margin: '4px 0' }}>
                  {liveStats.avgStrongRatio.toFixed(1)}%
                </strong>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Segments with threshold + 10% confidence</span>
              </div>
              <div style={{ background: 'var(--card-2)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block' }}>Max Consecutive Run Ratio</span>
                <strong style={{ fontSize: 20, color: 'var(--accent)', display: 'block', margin: '4px 0' }}>
                  {liveStats.avgMaxRunRatio.toFixed(1)}%
                </strong>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Temporal continuity of synthetic artifacts</span>
              </div>
              <div style={{ background: 'var(--card-2)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block' }}>Score Standard Deviation</span>
                <strong style={{ fontSize: 20, color: 'var(--text)', display: 'block', margin: '4px 0' }}>
                  ±{liveStats.scoreStdDev.toFixed(1)}%
                </strong>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Score dispersion across scanned dataset</span>
              </div>
            </div>
          </div>

          {/* Interactive Threshold Sensitivity Analyzer */}
          <div className="vdm-threshold card" style={{ marginBottom: 16 }}>
            <div className="card-head row">
              <div>
                <h3><Sliders size={16} /> Operational Decision Boundary Tuning</h3>
                <p className="muted">
                  Test how adjusting the operating threshold ({threshold * 100}%) affects flag rates and ambiguity on your real dataset.
                </p>
              </div>
              <span className="vdm-threshold-value">{(threshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={Math.round(threshold * 100)}
              onChange={(e) => setThreshold(Number(e.target.value) / 100)}
              className="vdm-slider"
            />
            <div className="vdm-threshold-metrics">
              <span>Current Flagged AI: <strong>{sensitivityCurrent.flaggedAi} scans ({sensitivityCurrent.flaggedAiRate}%)</strong></span>
              <span>Ambiguous (±8% margin): <strong>{sensitivityCurrent.ambiguous} scans ({sensitivityCurrent.ambiguousRate}%)</strong></span>
              <span>Default Deploy Threshold: <strong>58% (Recommended)</strong></span>
            </div>
          </div>

          {/* Real Charts Grid */}
          <div className="vdm-charts-grid">
            {/* Real Score Distribution Histogram */}
            <div className="card chart-card">
              <h3>Real Model Score Distribution</h3>
              <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Binned raw probabilities from model inference (0% = confident human, 100% = confident AI).
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreDist} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={0} angle={-35} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="ai" stackId="a" fill={AI} name="AI-Flagged" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="human" stackId="a" fill={HUMAN} name="Human-Flagged" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="legend">
                <span><i style={{ background: AI }} /> AI-Generated</span>
                <span><i style={{ background: HUMAN }} /> Human</span>
              </div>
            </div>

            {/* Threshold Sensitivity Curve */}
            <div className="card chart-card">
              <h3>Threshold Sensitivity Curve</h3>
              <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                AI Flagged Rate vs Ambiguity Rate as decision threshold changes across [10%..90%].
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sensitivityCurve} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="threshold"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v) => `${v}%`}
                    label={{ value: 'Threshold', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                  <ReferenceLine x={Math.round(threshold * 100)} stroke={ACCENT} strokeDasharray="3 3" label={{ value: 'Active', fill: ACCENT, fontSize: 10 }} />
                  <Line type="monotone" dataKey="aiRate" stroke={AI} strokeWidth={2} dot={false} name="Flagged AI %" />
                  <Line type="monotone" dataKey="ambiguousRate" stroke={WARN} strokeWidth={2} dot={false} name="Ambiguous %" />
                </LineChart>
              </ResponsiveContainer>
              <div className="legend">
                <span><i style={{ background: AI }} /> Flagged AI %</span>
                <span><i style={{ background: WARN }} /> Borderline Ambiguous %</span>
              </div>
            </div>

            {/* Recent Inferences Timeline */}
            <div className="card chart-card">
              <h3>Inference Score Timeline</h3>
              <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Raw score of recent scans against the active decision boundary.
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={scoreTimeline} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="scan" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                  <ReferenceLine y={Math.round(threshold * 100)} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 4" label={{ value: 'Threshold', fill: '#94a3b8', fontSize: 10 }} />
                  <Line type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} name="Raw Score %" />
                </LineChart>
              </ResponsiveContainer>
              <div className="legend">
                <span><i style={{ background: ACCENT }} /> Raw Score %</span>
                <span><i style={{ background: 'rgba(255,255,255,0.4)' }} /> Decision Threshold</span>
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="card chart-card">
              <h3>Language Detection Split</h3>
              <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Deepfake detection rate and scan frequency by language.
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={langBreakdown} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="language" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="ai" fill={AI} name="AI Scans" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="human" fill={HUMAN} name="Human Scans" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="legend">
                <span><i style={{ background: AI }} /> AI Detected</span>
                <span><i style={{ background: HUMAN }} /> Human Detected</span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'benchmark' && (
        <>
          {/* Honest Ground Truth Status Header */}
          {!hasLabels ? (
            <div className="alert warn" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
              <HelpCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Ground Truth Labels Required for Benchmark Metrics</strong>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                  Supervised validation metrics (Accuracy, Precision, Recall, Specificity, F1-score, ROC-AUC, and EER) calculate the model&apos;s agreement with verified reality.
                  No samples have been tagged yet. Tag known AI and Human audio in the table below to calculate real empirical benchmark metrics.
                </p>
              </div>
            </div>
          ) : (
            <div className="alert success" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <ShieldCheck size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>Empirical Benchmark Active:</strong> Evaluated on {labeledItems.length} ground-truth labeled samples.
                {!hasBothClasses && ' (Note: Tag at least one AI and one Human sample for full ROC and EER curves)'}
              </div>
            </div>
          )}

          {hasLabels && (
            <>
              {/* Empirical Metric Cards */}
              <div className="vdm-stat-row" style={{ marginBottom: 16 }}>
                <MiniMetricCard
                  label="Empirical Accuracy"
                  value={accuracy !== null ? `${(accuracy * 100).toFixed(1)}%` : '—'}
                  sub={`${cm.tp + cm.tn}/${cm.total} correct`}
                  tone="accent"
                />
                <MiniMetricCard
                  label="Precision"
                  value={precision !== null ? `${(precision * 100).toFixed(1)}%` : '—'}
                  sub="TP / (TP + FP)"
                  tone="success"
                />
                <MiniMetricCard
                  label="Recall (TPR)"
                  value={recall !== null ? `${(recall * 100).toFixed(1)}%` : '—'}
                  sub="TP / (TP + FN)"
                  tone="warn"
                />
                <MiniMetricCard
                  label="F1 Score"
                  value={f1 !== null ? `${(f1 * 100).toFixed(1)}%` : '—'}
                  sub="Harmonic mean"
                  tone="accent"
                />
                <MiniMetricCard
                  label="Specificity (TNR)"
                  value={specificity !== null ? `${(specificity * 100).toFixed(1)}%` : '—'}
                  sub="TN / (TN + FP)"
                  tone="success"
                />
                <MiniMetricCard
                  label="AUC-ROC"
                  value={auc !== null ? auc.toFixed(3) : '—'}
                  sub={hasBothClasses ? 'Separability' : 'Need both classes'}
                  tone="accent"
                />
              </div>

              {/* Confusion Matrix */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-head">
                  <h3>Confusion Matrix</h3>
                  <p className="muted">Empirical validation on {labeledItems.length} verified ground truth samples</p>
                </div>
                <ConfusionMatrixViz cm={cm} />
              </div>

              {/* ROC & DET Curves (when both classes are present) */}
              {hasBothClasses && rocCurve.length > 1 && (
                <div className="vdm-charts-grid" style={{ marginBottom: 16 }}>
                  <div className="card chart-card">
                    <h3>Empirical ROC Curve <span className="muted" style={{ fontWeight: 400 }}>AUC = {auc?.toFixed(3)}</span></h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={rocCurve} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rocFillReal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={GRID} />
                        <XAxis
                          dataKey="fpr"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                          label={{ value: 'False Positive Rate (FPR)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }}
                        />
                        <YAxis
                          domain={[0, 1]}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                          label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft', offset: 16, fontSize: 10, fill: '#94a3b8' }}
                        />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${(v * 100).toFixed(1)}%`} />
                        <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="rgba(226,232,240,0.3)" strokeDasharray="4 4" />
                        <Area type="monotone" dataKey="tpr" stroke={ACCENT} fill="url(#rocFillReal)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card chart-card">
                    <h3>DET Curve <span className="muted" style={{ fontWeight: 400 }}>EER = {eer ? `${(eer * 100).toFixed(1)}%` : '—'}</span></h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={detCurve} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                        <CartesianGrid stroke={GRID} />
                        <XAxis
                          dataKey="fpr"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                          label={{ value: 'False Alarm Rate', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }}
                        />
                        <YAxis
                          domain={[0, 1]}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                          label={{ value: 'Missed Detection Rate', angle: -90, position: 'insideLeft', offset: 16, fontSize: 10, fill: '#94a3b8' }}
                        />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${(v * 100).toFixed(1)}%`} />
                        <Line type="monotone" dataKey="fnr" stroke={WARN} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Ground Truth Tagger Table with Instant Live Sync */}
          <div className="vdm-tagger card">
            <div className="card-head row" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3><Tag size={16} /> Sample Ground Truth Labeling</h3>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 9px',
                      borderRadius: 12,
                      background: justUpdated ? 'rgba(34,211,238,0.25)' : 'rgba(52,211,153,0.15)',
                      color: justUpdated ? 'var(--accent)' : 'var(--success)',
                      border: '1px solid currentColor',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <Zap size={11} /> {justUpdated ? '⚡ Recalculated Just Now!' : '⚡ Live Auto-Sync Active'}
                  </span>
                </div>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                  Tag scan items below. Accuracy, Precision, Recall, and the Confusion Matrix recalculate <strong>instantly in real time</strong> with every click.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="chip" style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
                  {labeledItems.length} / {items.length} labeled
                </span>
                {labeledItems.length > 0 && (
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      clearAllGroundTruth()
                      flashUpdate()
                    }}
                    title="Reset all ground-truth tags"
                    style={{ fontSize: 11.5, padding: '4px 10px' }}
                  >
                    <RotateCcw size={12} /> Clear All Tags
                  </button>
                )}
              </div>
            </div>

            {/* Live Instant Recalculation Bar */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                padding: '10px 14px',
                background: justUpdated ? 'rgba(34,211,238,0.12)' : 'var(--card-2)',
                border: `1px solid ${justUpdated ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10,
                margin: '12px 0 14px',
                fontSize: 12.5,
                alignItems: 'center',
                transition: 'background 0.3s ease, border-color 0.3s ease',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={13} /> Live Output:
              </span>
              <span>
                Accuracy: <strong style={{ color: accuracy === 1 ? 'var(--success)' : accuracy !== null ? 'var(--accent)' : 'var(--muted)' }}>
                  {accuracy !== null ? `${(accuracy * 100).toFixed(1)}%` : '—'}
                </strong>
              </span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span>Precision: <strong>{precision !== null ? `${(precision * 100).toFixed(1)}%` : '—'}</strong></span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span>Recall: <strong>{recall !== null ? `${(recall * 100).toFixed(1)}%` : '—'}</strong></span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span>F1: <strong>{f1 !== null ? `${(f1 * 100).toFixed(1)}%` : '—'}</strong></span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span>
                TP: <strong style={{ color: 'var(--success)' }}>{cm.tp}</strong> ·{' '}
                FP: <strong style={{ color: cm.fp > 0 ? 'var(--danger)' : 'var(--text)' }}>{cm.fp}</strong> ·{' '}
                TN: <strong style={{ color: 'var(--success)' }}>{cm.tn}</strong> ·{' '}
                FN: <strong style={{ color: cm.fn > 0 ? 'var(--warn)' : 'var(--text)' }}>{cm.fn}</strong>
              </span>
            </div>

            {/* Quick 1-click test button to visibly see live drop */}
            {labeledItems.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'rgba(34,211,238,0.06)',
                  border: '1px dashed rgba(34,211,238,0.35)',
                  borderRadius: 8,
                  marginBottom: 12,
                  fontSize: 12,
                }}
              >
                <span>
                  💡 <strong>Test live calculation:</strong> Click below to flip 1 sample to see Accuracy instantly drop and False Positives increase live:
                </span>
                <button
                  className="btn ghost sm"
                  style={{ fontSize: 11.5, padding: '4px 10px', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                  onClick={() => {
                    const firstAi = labeledItems.find((x) => x.groundTruth === 'ai')
                    if (firstAi) {
                      setGroundTruth(firstAi.id, 'human')
                    } else if (labeledItems[0]) {
                      setGroundTruth(labeledItems[0].id, labeledItems[0].groundTruth === 'ai' ? 'human' : 'ai')
                    }
                    flashUpdate()
                  }}
                >
                  <Zap size={12} /> Test Live Disagreement (Flip 1 to Human)
                </button>
              </div>
            )}

            <div className="vdm-tagger-list">
              {items.slice(0, 30).map((item) => {
                const modelAi = isAi(item.classification)
                return (
                  <div key={item.id} className="vdm-tagger-row">
                    <span className="ellipsis" style={{ maxWidth: 180, fontWeight: 500 }} title={item.fileName}>
                      {item.fileName || 'Live Audio Stream'}
                    </span>
                    <span className="muted" style={{ fontSize: 11 }}>
                      Model:
                    </span>
                    <span className={`tag ${modelAi ? 'ai' : 'human'}`}>
                      {modelAi ? 'AI' : 'Human'} ({pct(item.confidenceScore)})
                    </span>

                    {/* Live agreement status chip */}
                    {item.groundTruth ? (
                      modelAi && item.groundTruth === 'ai' ? (
                        <span className="chip" style={{ fontSize: 10.5, background: 'rgba(52,211,153,0.12)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.3)' }}>
                          ✓ True AI (TP)
                        </span>
                      ) : !modelAi && item.groundTruth === 'human' ? (
                        <span className="chip" style={{ fontSize: 10.5, background: 'rgba(52,211,153,0.12)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.3)' }}>
                          ✓ True Human (TN)
                        </span>
                      ) : modelAi && item.groundTruth === 'human' ? (
                        <span className="chip" style={{ fontSize: 10.5, background: 'rgba(244,63,94,0.15)', color: 'var(--danger)', border: '1px solid rgba(244,63,94,0.3)' }}>
                          ⚠ False Alarm (FP)
                        </span>
                      ) : (
                        <span className="chip" style={{ fontSize: 10.5, background: 'rgba(251,191,36,0.15)', color: 'var(--warn)', border: '1px solid rgba(251,191,36,0.3)' }}>
                          ⚠ Missed AI (FN)
                        </span>
                      )
                    ) : (
                      <span className="muted" style={{ fontSize: 11 }}>Unlabeled</span>
                    )}

                    <div className="vdm-tagger-btns">
                      <button
                        className={`btn ${item.groundTruth === 'ai' ? 'danger' : 'ghost'}`}
                        onClick={() => {
                          setGroundTruth(item.id, item.groundTruth === 'ai' ? null : 'ai')
                          flashUpdate()
                        }}
                        title="Mark verified as AI"
                      >
                        <ShieldAlert size={13} /> {item.groundTruth === 'ai' ? '✓ Verified AI' : 'Mark AI'}
                      </button>
                      <button
                        className={`btn ${item.groundTruth === 'human' ? 'primary' : 'ghost'}`}
                        onClick={() => {
                          setGroundTruth(item.id, item.groundTruth === 'human' ? null : 'human')
                          flashUpdate()
                        }}
                        title="Mark verified as Human"
                      >
                        <ShieldCheck size={13} /> {item.groundTruth === 'human' ? '✓ Verified Human' : 'Mark Human'}
                      </button>
                      {item.groundTruth && (
                        <button
                          className="btn ghost"
                          style={{ padding: '4px 8px', fontSize: 11, color: 'var(--muted)' }}
                          onClick={() => {
                            setGroundTruth(item.id, null)
                            flashUpdate()
                          }}
                          title="Clear label"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
