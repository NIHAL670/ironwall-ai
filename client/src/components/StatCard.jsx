export default function StatCard({ icon: Icon, label, value, sub, tone = 'default' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon">{Icon ? <Icon size={20} /> : null}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {sub ? <span className="stat-sub">{sub}</span> : null}
      </div>
    </div>
  )
}
