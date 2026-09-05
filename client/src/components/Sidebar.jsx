import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Home, LayoutDashboard, AudioLines, Radio, History, ShieldCheck, BarChart3, Menu, X } from 'lucide-react'
import { APP_NAME } from '../config/env.js'

const links = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analyze', label: 'Analyze Audio', icon: AudioLines },
  { to: '/live', label: 'Live Monitor', icon: Radio, live: true },
  { to: '/history', label: 'Scan History', icon: History },
  { to: '/metrics', label: 'Evaluation', icon: BarChart3 },
]

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <Link to="/" className="brand" title="Return to Start Page" style={{ textDecoration: 'none' }}>
          <ShieldCheck size={22} />
          <div>
            <strong>{APP_NAME}</strong>
            <span>Detection Console</span>
          </div>
        </Link>

        <nav className="nav">
          {links.map(({ to, label, icon: Icon, end, live }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="nav-link"
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {live ? <i className="live-dot" aria-hidden="true" /> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <p>Audio deepfake detection</p>
          <p className="muted">English · Hindi · Tamil · Telugu · Malayalam</p>
        </div>
      </aside>

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}
    </>
  )
}

