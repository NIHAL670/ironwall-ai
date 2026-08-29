const stateLabel = {
  silent: 'silence — not scored',
  skipped: 'dropped — queue busy',
  error: 'request failed',
}

/** One tile per analysed segment, coloured by AI likelihood. */
export default function SegmentStrip({ points, segmentSeconds }) {
  if (!points.length) return null

  return (
    <div className="seg-strip">
      {points.map((p) => {
        const has = p.ai != null
        const hue = has ? 152 - 152 * (p.ai / 100) : 0
        const title = has
          ? `t+${p.t}s · ${p.ai}% AI likelihood${p.classification ? ` · ${p.classification}` : ''}`
          : `t+${p.t}s · ${stateLabel[p.state] || p.state}`

        return (
          <div
            key={`${p.index}-${p.state}`}
            className={`seg-tile ${p.state}`}
            title={title}
            style={
              has
                ? {
                    background: `hsla(${hue}, 85%, 55%, 0.85)`,
                    boxShadow: `0 0 12px hsla(${hue}, 85%, 55%, 0.35)`,
                  }
                : undefined
            }
          >
            <span>{p.index + 1}</span>
          </div>
        )
      })}
      <span className="muted seg-note">{segmentSeconds}s per tile</span>
    </div>
  )
}
