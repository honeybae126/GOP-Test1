'use client'

import { useState } from 'react'

const TABS = ['Heart', 'Lungs', 'Stomach', 'Body', 'Eye'] as const
type HealthTab = (typeof TABS)[number]

type IconColor = 'red' | 'purple' | 'green' | 'orange' | 'blue'

interface MetricData {
  icon: string
  iconColor: IconColor
  label: string
  value: string
  status: string
}

const HEART_METRICS: MetricData[] = [
  { icon: 'fas fa-heart',     iconColor: 'red',    label: 'Heart Rate',  value: '120 bpm', status: 'Normal' },
  { icon: 'fas fa-droplet',   iconColor: 'purple', label: 'Blood Count', value: '80-90',   status: 'Good'   },
  { icon: 'fas fa-heartbeat', iconColor: 'green',  label: 'Glucose',     value: '230 /ml', status: 'Normal' },
  { icon: 'fas fa-eye',       iconColor: 'orange', label: 'Hemoglobin',  value: '56 /ml',  status: 'Low'    },
]

interface HealthOverviewProps {
  defaultTab?: HealthTab
  metricsMap?: Partial<Record<HealthTab, MetricData[]>>
}

export function HealthOverview({
  defaultTab = 'Heart',
  metricsMap,
}: HealthOverviewProps) {
  const [activeTab, setActiveTab] = useState<HealthTab>(defaultTab)

  const metrics = metricsMap?.[activeTab] ?? HEART_METRICS

  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">Health Overview</h2>
        <button className="section-action">
          <span>Today</span>
          <i className="fas fa-chevron-down" />
        </button>
      </div>

      <div className="health-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`health-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="metric-grid">
        {metrics.map((m, i) => (
          <div key={i} className={`metric-card ${m.iconColor}`}>
            <div className={`metric-icon ${m.iconColor}`}>
              <i className={m.icon} />
            </div>
            <p className="metric-label">{m.label}</p>
            <p className="metric-value">{m.value}</p>
            <p className="metric-status">{m.status}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
