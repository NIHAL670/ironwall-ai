import { NavLink } from 'react-router-dom'
import { LayoutDashboard, AudioLines, Radio, History, ShieldCheck } from 'lucide-react'
import { APP_NAME } from '../config/env.js'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/analyze', label: 'Analyze Audio', icon: AudioLines },
  { to: '/live', label: 'Live Monitor', icon: Radio, live: true },
  { to: '/history', label: 'Scan History', icon: History },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <ShieldCheck size={22} />
        <div>
          <strong>{APP_NAME}</strong>
          <span>Detection Console</span>
        </div>
      </div>

      <nav className="nav">
        {links.map(({ to, label, icon: Icon, end, live }) => (
          <NavLink key={to} to={to} end={end} className="nav-link">
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
  )
}
