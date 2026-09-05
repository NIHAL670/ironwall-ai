import { Download, Trash2 } from 'lucide-react'
import HistoryTable from '../components/HistoryTable.jsx'
import { useHistory } from '../hooks/useHistory.jsx'

export default function History() {
  const { items, remove, clear } = useHistory()

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ironwall-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <section className="card">
        <div className="card-head row">
          <div>
            <h2>Scan history</h2>
            <p className="muted">{items.length} record{items.length === 1 ? '' : 's'} · stored in this browser</p>
          </div>
          <div className="btn-group">
            <button className="btn ghost" onClick={exportJson} disabled={!items.length}>
              <Download size={15} /> Export JSON
            </button>
            <button
              className="btn danger"
              onClick={() => {
                if (confirm('Clear all scan history?')) clear()
              }}
              disabled={!items.length}
            >
              <Trash2 size={15} /> Clear all
            </button>
          </div>
        </div>

        <HistoryTable items={items} onRemove={remove} />
      </section>
    </div>
  )
}
