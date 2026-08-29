import { useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useHealth } from '../hooks/useHealth.js'
import { API_INFO } from '../api/client.js'

const titles = {
  '/': 'Dashboard',
  '/analyze': 'Analyze Audio',
  '/history': 'Scan History',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const { status, data, refresh } = useHealth()

  return (
    <header className="topbar">
      <h1>{titles[pathname] || 'IronWall AI'}</h1>

      <div className="topbar-right">
        <code className="api-chip" title="Configured via .env (VITE_API_BASE_URL)">
          {API_INFO.base}
        </code>
        <button className={`status-pill ${status}`} onClick={refresh} title="Refresh service status">
          <span className="dot" />
          {status === 'online'
            ? `Service online${data?.queue_size != null ? ` · queue ${data.queue_size}/${data.queue_capacity}` : ''}`
            : status === 'checking'
              ? 'Checking service…'
              : 'Service offline'}
          <RefreshCw size={13} />
        </button>
      </div>
    </header>
  )
}
