import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ShieldAlert, ShieldCheck, Gauge, Radio, ArrowRight, BarChart3, Target } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import AnalyticsCharts from '../components/AnalyticsCharts.jsx'
import HistoryTable from '../components/HistoryTable.jsx'
import UploadPanel from '../components/UploadPanel.jsx'
import ResultCard from '../components/ResultCard.jsx'
import { useHistory } from '../hooks/useHistory.jsx'
import { useHealth } from '../hooks/useHealth.js'
import { isAi, pct } from '../utils/format.js'

export default function Dashboard() {
  const { items, add } = useHistory()
  const health = useHealth()
  const [latest, setLatest] = useState(null)

  const stats = useMemo(() => {
    const total = items.length
    const ai = items.filter((x) => isAi(x.classification)).length
    const avgConf =
      total === 0
        ? 0
        : items.reduce((s, x) => s + (Number(x.confidenceScore) || 0), 0) / total
    const avgScore =
      total === 0
        ? 0
        : items.reduce((s, x) => s + (Number(x.score ?? x.confidenceScore) || 0), 0) / total
    const avgAiRatio =
      total === 0
        ? 0
        : items.reduce((s, x) => s + (Number(x.aiRatio) || 0), 0) / total

    return {
      total,
      ai,
      human: total - ai,
      avgConf,
      avgScore,
      avgAiRatio,
    }
  }, [items])

  const handleResult = (entry) => {
    add(entry)
    setLatest({ ...entry, ts: Date.now() })
  }

  return (
    <div className="page">
      {health.status === 'offline' && (
        <div className="alert warn">
          Can't reach the detection service on <code>/health</code>. Make sure the FastAPI
          server (services/ml) is running and <code>VITE_PROXY_TARGET</code> in{' '}
          <code>.env</code> points to it.
        </div>
      )}

      <section className="stat-row">
        <StatCard icon={Activity} label="Total scans" value={stats.total} tone="accent" />
        <StatCard
          icon={ShieldAlert}
          label="AI-Generated"
          value={stats.ai}
          sub={stats.total ? pct(stats.ai / stats.total) + ' of scans' : '—'}
          tone="danger"
        />
        <StatCard
          icon={ShieldCheck}
          label="Human"
          value={stats.human}
          sub={stats.total ? pct(stats.human / stats.total) + ' of scans' : '—'}
          tone="success"
        />
        <StatCard
          icon={Gauge}
          label="Avg. confidence"
          value={pct(stats.avgConf)}
          sub="across all scans"
        />
        <StatCard
          icon={Target}
          label="Mean AI Score"
          value={stats.total ? pct(stats.avgScore) : '—'}
          sub="model raw probability"
          tone="accent"
        />
        <StatCard
          icon={BarChart3}
          label="Segment Coverage"
          value={stats.total ? pct(stats.avgAiRatio) : '—'}
          sub="synthetic audio ratio"
          tone="warn"
        />
      </section>

      <Link to="/live" className="live-cta">
        <span className="live-cta-icon">
          <Radio size={20} />
          <i className="ping" />
        </span>
        <span className="live-cta-text">
          <strong>Live microphone monitor</strong>
          <span className="muted">
            Watch the waveform animate and the AI-likelihood graph fill in while you speak.
          </span>
        </span>
        <ArrowRight size={18} />
      </Link>

      <AnalyticsCharts items={items} />

      <section className="split">
        <div>
          <UploadPanel onResult={handleResult} />
        </div>
        <div className="latest-col">
          <h2>Latest result</h2>
          {latest ? (
            <ResultCard entry={latest} />
          ) : (
            <p className="muted empty card">Run a detection to see the verdict here.</p>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-head row">
          <h2>Recent scans</h2>
          <div className="btn-group">
            <Link className="link" to="/metrics">Evaluation metrics →</Link>
            <Link className="link" to="/history">View all →</Link>
          </div>
        </div>
        <HistoryTable items={items} limit={6} />
      </section>
    </div>
  )
}

