import { ShieldAlert, ShieldCheck } from 'lucide-react'
import ConfidenceGauge from './ConfidenceGauge.jsx'
import { isAi, verdictLabel, fmtTime } from '../utils/format.js'

export default function ResultCard({ entry }) {
  if (!entry) return null
  const ai = isAi(entry.classification)
  const Icon = ai ? ShieldAlert : ShieldCheck

  return (
    <div className={`result-card ${ai ? 'ai' : 'human'}`}>
      <div className="result-head">
        <div className={`verdict-badge ${ai ? 'ai' : 'human'}`}>
          <Icon size={18} />
          {verdictLabel(entry.classification)}
        </div>
        {entry.ts ? <span className="muted">{fmtTime(entry.ts)}</span> : null}
      </div>

      <div className="result-body">
        <ConfidenceGauge value={entry.confidenceScore} ai={ai} />
        <div className="result-detail">
          <p className="explanation">{entry.explanation || 'No explanation returned.'}</p>
          <div className="chips">
            {entry.fileName ? <span className="chip">{entry.fileName}</span> : null}
            {entry.language ? <span className="chip">{entry.language}</span> : null}
            {entry.audioFormat ? <span className="chip">.{entry.audioFormat}</span> : null}
            {entry.durationSec ? (
              <span className="chip">{Math.round(entry.durationSec)}s audio</span>
            ) : null}
            {entry.source === 'live' ? <span className="chip accent">live session</span> : null}
          </div>
          {entry.audioUrl ? (
            <audio className="audio-preview" controls src={entry.audioUrl} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
