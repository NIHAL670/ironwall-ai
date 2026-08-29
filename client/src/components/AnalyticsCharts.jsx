import {ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts'
import { isAi } from '../utils/format.js'

const AI = '#f43f5e'
const HUMAN = '#34d399'
const GRID = 'rgba(148,163,184,0.15)'

function tooltipStyle(){
  return{
    background: '#0f172a',
    border: '1px solid rgba(148,163,184,0.25)',
    borderRadius: 8,
    fontSize: 12,
  }
}

export default function AnalyticsCharts({ items }){
  const aiCount = items.filter((x) => isAi(x.classification)).length
  const humanCount = items.length - aiCount

  const pieData = [
    { name: 'AI-Generated', value: aiCount },
    { name: 'Human', value: humanCount },
  ]

  const trend = [...items]
    .slice(0, 12)
    .reverse()
    .map((x, i) => ({
      name: `#${i + 1}`,
      confidence: Math.round((Number(x.confidenceScore) || 0) * 100),
      fill: isAi(x.classification) ? AI : HUMAN,
    }))

  const byDay = {}
  items.forEach((x) => {
    const d = new Date(x.ts)
    const key = `${d.getMonth() + 1}/${d.getDate()}`
    byDay[key] = byDay[key] || { day: key, ai: 0, human: 0 }
    if (isAi(x.classification)) byDay[key].ai += 1
    else byDay[key].human += 1
  })
  const dayData = Object.values(byDay).slice(-7)

  const empty = items.length === 0

  return (
    <div className="charts-grid">
      <div className="card chart-card">
        <h3>Verdict split</h3>
        {empty ? (
          <p className="muted empty">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                <Cell fill={AI} />
                <Cell fill={HUMAN} />
              </Pie>
              <Tooltip contentStyle={tooltipStyle()} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="legend">
          <span><i style={{ background: AI }} /> AI-Generated · {aiCount}</span>
          <span><i style={{ background: HUMAN }} /> Human · {humanCount}</span>
        </div>
      </div>

      <div className="card chart-card">
        <h3>Confidence trend (recent)</h3>
        {empty ? (
          <p className="muted empty">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card chart-card">
        <h3>Scans per day</h3>
        {empty ? (
          <p className="muted empty">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dayData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Bar dataKey="human" stackId="a" fill={HUMAN} radius={[0, 0, 0, 0]} />
              <Bar dataKey="ai" stackId="a" fill={AI} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
