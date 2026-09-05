import { Trash2, ShieldAlert, ShieldCheck, Tag } from 'lucide-react'
import { fmtTime, isAi, verdictLabel, pct } from '../utils/format.js'

export default function HistoryTable({ items, onRemove, limit }) {
  const rows = limit ? items.slice(0, limit) : items

  if (!rows.length) {
    return <p className="muted empty">No scans yet. Run a detection to populate this list.</p>
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>File</th>
            <th>Language</th>
            <th>Verdict</th>
            <th>Confidence</th>
            <th>Truth</th>
            {onRemove ? <th aria-label="actions" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const ai = isAi(r.classification)
            return (
              <tr key={r.id}>
                <td className="nowrap">{fmtTime(r.ts)}</td>
                <td className="ellipsis" title={r.fileName}>{r.fileName || '—'}</td>
                <td>{r.language || '—'}</td>
                <td>
                  <span className={`tag ${ai ? 'ai' : 'human'}`}>
                    {ai ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                    {verdictLabel(r.classification)}
                  </span>
                </td>
                <td>{pct(r.confidenceScore)}</td>
                <td>
                  {r.groundTruth ? (
                    <span className={`tag ${r.groundTruth === 'ai' ? 'ai' : 'human'}`} title="Ground truth label">
                      <Tag size={11} />
                      {r.groundTruth === 'ai' ? 'AI' : 'Human'}
                    </span>
                  ) : (
                    <span className="muted" style={{ fontSize: 11 }}>—</span>
                  )}
                </td>
                {onRemove ? (
                  <td>
                    <button className="icon-btn" onClick={() => onRemove(r.id)} title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

