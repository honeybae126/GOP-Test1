import type { MOCK_DASHBOARD_STATS } from '@/lib/mock-data'

interface DashboardStatsProps {
  stats: typeof MOCK_DASHBOARD_STATS
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const metrics = [
    { label: 'Total Requests',  value: stats.totalRequests,        icon: 'fas fa-file-medical',  color: 'blue' },
    { label: 'Draft',           value: stats.draft,                 icon: 'fas fa-pencil-alt',    color: 'orange' },
    { label: 'Submitted',       value: stats.submitted,             icon: 'fas fa-paper-plane',   color: 'purple' },
    { label: 'Approved',        value: stats.approved,              icon: 'fas fa-check-circle',  color: 'green' },
    { label: 'Rejected',        value: stats.rejected,              icon: 'fas fa-times-circle',  color: 'red' },
    { label: 'Avg. Turnaround', value: `${stats.avgTurnaroundHours}h`, icon: 'fas fa-clock',     color: 'blue' },
  ]

  return (
    <div className="metric-grid">
      {metrics.map(m => (
        <div key={m.label} className="metric-card">
          <div className={`metric-icon ${m.color}`}><i className={m.icon} /></div>
          <p className="metric-label">{m.label}</p>
          <p className="metric-value">{m.value}</p>
        </div>
      ))}
    </div>
  )
}
