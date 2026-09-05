import { useState } from 'react'
import { Mic, Square, Loader2, RotateCcw, Radio, Activity, Timer } from 'lucide-react'
import LiveWaveform from '../components/LiveWaveform.jsx'
import LiveAiMeter from '../components/LiveAiMeter.jsx'
import LiveChart from '../components/LiveChart.jsx'
import LiveMetricsPanel from '../components/LiveMetricsPanel.jsx'
import SegmentStrip from '../components/SegmentStrip.jsx'
import ResultCard from '../components/ResultCard.jsx'
import { useLiveAnalyzer } from '../hooks/useLiveAnalyzer.js'
import { useHistory } from '../hooks/useHistory.jsx'
import { useHealth } from '../hooks/useHealth.js'
import { fmtDuration } from '../utils/format.js'
import { LIVE_SEGMENT_SECONDS } from '../config/env.js'

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam']

export default function Live() {
  const [language, setLanguage] = useState('English')
  const { add } = useHistory()
  const health = useHealth()

  const live = useLiveAnalyzer({ language, onFinal: add })

  const meterValue = live.latest?.ai ?? null
  const aiLevel = meterValue == null ? 0 : meterValue / 100
  const finalizing = live.status === 'finalizing'

  return (
    <div className="page live-page">
      {!live.supported && (
        <div className="alert warn">
          Live capture needs microphone access and the Web Audio API. Try a recent Chrome,
          Edge or Firefox over <code>localhost</code> or HTTPS.
        </div>
      )}
      {health.status === 'offline' && (
        <div className="alert warn">
          The detection service is unreachable, so segments can't be scored. Start the
          FastAPI server in <code>services/ml</code> and check <code>VITE_PROXY_TARGET</code>.
        </div>
      )}
      {live.error && <div className="alert error">{live.error}</div>}

      <section className="live-hero card">
        <div className="live-hero-main">
          <div className="live-head">
            <div>
              <h2>
                <Radio size={17} />
                Live microphone monitor
              </h2>
              <p className="muted">
                Audio is scored continuously — a new reading lands every{' '}
                {LIVE_SEGMENT_SECONDS} seconds while you speak.
              </p>
            </div>

            <div className="live-meta">
              <span className="meta-chip">
                <Timer size={13} /> {fmtDuration(live.elapsed)}
              </span>
              <span className="meta-chip">
                <Activity size={13} /> {live.scored.length} scored
              </span>
              {live.pending > 0 && (
                <span className="meta-chip busy">
                  <Loader2 size={13} className="spin" /> {live.pending} in flight
                </span>
              )}
            </div>
          </div>

          <LiveWaveform analyser={live.analyser} active={live.running} aiLevel={aiLevel} />

          <div className="live-controls">
            {!live.running ? (
              <button
                className="btn primary lg"
                onClick={live.start}
                disabled={!live.supported || finalizing}
              >
                {finalizing ? (
                  <>
                    <Loader2 size={17} className="spin" /> Finalising…
                  </>
                ) : (
                  <>
                    <Mic size={17} /> Start live monitoring
                  </>
                )}
              </button>
            ) : (
              <button className="btn danger lg pulse" onClick={live.stop}>
                <Square size={16} /> Stop · {fmtDuration(live.elapsed)}
              </button>
            )}

            <label className="lang-select">
              Language
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={live.running}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="btn ghost"
              onClick={live.reset}
              disabled={live.running || finalizing || !live.points.length}
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>

          <SegmentStrip points={live.points} segmentSeconds={live.segmentSeconds} />
        </div>

        <div className="live-hero-side">
          <LiveAiMeter
            value={meterValue}
            pending={live.pending > 0}
            active={live.running}
          />
          <dl className="live-stats">
            <div>
              <dt>Session average</dt>
              <dd>{live.average == null ? '—' : `${Math.round(live.average)}%`}</dd>
            </div>
            <div>
              <dt>Peak reading</dt>
              <dd>
                {live.scored.length
                  ? `${Math.max(...live.scored.map((p) => p.ai))}%`
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <LiveChart points={live.points} segmentSeconds={live.segmentSeconds} />

      <LiveMetricsPanel points={live.points} scored={live.scored} />

      {(live.finalResult || finalizing) && (
        <section>
          <h2 className="section-title">Session verdict</h2>
          {finalizing && !live.finalResult ? (
            <div className="card empty muted">
              <Loader2 size={18} className="spin" /> Scoring the full recording…
            </div>
          ) : (
            <ResultCard entry={live.finalResult} />
          )}
        </section>
      )}
    </div>
  )
}
