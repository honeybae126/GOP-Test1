interface DiagnosisEntry {
  icon: string
  title: string
  description: string
  doctor: string
}

interface StatusCard {
  label: string
  value: string
  description: string
  gradient?: boolean
  valueColor?: string
}

interface DiagnosisHistoryProps {
  items?: DiagnosisEntry[]
  visualizationSrc?: string
  primaryStatus?: StatusCard
  secondaryStatus?: StatusCard
}

const DEFAULT_ITEMS: DiagnosisEntry[] = [
  {
    icon: '❤️',
    title: 'Heart Problem',
    description:
      'Coronary artery disease is a common heart condition that affects the major blood vessels that supply the heart muscle.',
    doctor: 'Dr. Ronald Richards',
  },
  {
    icon: '🫘',
    title: 'Kidney Problem',
    description:
      'Coronary artery disease is a common heart condition that affects the major blood vessels that supply the heart muscle.',
    doctor: 'Dr. Lealle Alexander',
  },
  {
    icon: '🦵',
    title: 'Knee Problem',
    description:
      'Coronary artery disease is a common heart condition that affects the major blood vessels that supply the heart muscle.',
    doctor: 'Dr. Robert Fox',
  },
]

const DEFAULT_PRIMARY: StatusCard = {
  label: 'Status',
  value: 'Good',
  description: 'Your health is stable',
  valueColor: 'var(--success)',
}

const DEFAULT_SECONDARY: StatusCard = {
  label: 'Next Checkup',
  value: 'May 15',
  description: 'Schedule appointment',
  gradient: true,
}

export function DiagnosisHistory({
  items = DEFAULT_ITEMS,
  visualizationSrc = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663581635119/8dbYeHfhb9w5uz6cr2ETbu/synthcare-health-visualization-YkNEckRRbgC35GzVJ8kZMf.webp',
  primaryStatus = DEFAULT_PRIMARY,
  secondaryStatus = DEFAULT_SECONDARY,
}: DiagnosisHistoryProps) {
  return (
    <div className="card-grid-3">
      {/* Main card — spans 2 columns */}
      <div style={{ gridColumn: 'span 2' }} className="card">
        <div className="section-header">
          <h2 className="section-title">History of Diagnosis</h2>
          <button className="section-action">
            <span>Today</span>
            <i className="fas fa-chevron-down" />
          </button>
        </div>

        <div className="diagnosis-container">
          <div className="diagnosis-visualization">
            <img src={visualizationSrc} alt="Health Visualization" />
          </div>

          <div className="diagnosis-list">
            {items.map((item, i) => (
              <div key={i} className="diagnosis-item">
                <span className="diagnosis-item-icon">{item.icon}</span>
                <div className="diagnosis-item-content">
                  <h4 className="diagnosis-item-title">{item.title}</h4>
                  <p className="diagnosis-item-description">{item.description}</p>
                  <p className="diagnosis-item-doctor">{item.doctor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status cards column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div className="status-card">
          <div className="status-card-label">{primaryStatus.label}</div>
          <div
            className="status-card-value"
            style={{ color: primaryStatus.valueColor ?? 'var(--foreground)' }}
          >
            {primaryStatus.value}
          </div>
          <div className="status-card-description">{primaryStatus.description}</div>
        </div>

        <div className={`status-card${secondaryStatus.gradient ? ' status-card-gradient' : ''}`}>
          <div className="status-card-label">{secondaryStatus.label}</div>
          <div
            className="status-card-value"
            style={{ color: secondaryStatus.gradient ? 'white' : (secondaryStatus.valueColor ?? 'var(--foreground)') }}
          >
            {secondaryStatus.value}
          </div>
          <div className="status-card-description">{secondaryStatus.description}</div>
        </div>
      </div>
    </div>
  )
}
