interface ScheduleSlot {
  time: string
  dose: string
}

interface PrescriptionItem {
  name: string
  frequency: string
  schedule: [ScheduleSlot, ScheduleSlot, ScheduleSlot]
  onMenu?: () => void
}

interface PrescriptionsCardProps {
  items?: PrescriptionItem[]
}

const DEFAULT_ITEMS: PrescriptionItem[] = [
  {
    name: 'Paracetamol - 500mg',
    frequency: '1 tablet every day for 2 weeks',
    schedule: [
      { time: 'Morning',   dose: '1-pill'  },
      { time: 'Afternoon', dose: '1-pill'  },
      { time: 'Evening',   dose: '1-pill'  },
    ],
  },
  {
    name: 'Liquifying - 450ml',
    frequency: '1 teaspoon every day for 2 weeks',
    schedule: [
      { time: 'Morning',   dose: '1-spoon' },
      { time: 'Afternoon', dose: '1-spoon' },
      { time: 'Evening',   dose: '1-spoon' },
    ],
  },
]

export function PrescriptionsCard({ items = DEFAULT_ITEMS }: PrescriptionsCardProps) {
  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">Your Prescriptions</h2>
        <button className="section-action">
          <span>Today</span>
          <i className="fas fa-chevron-down" />
        </button>
      </div>

      <div className="prescription-grid">
        {items.map((item, i) => (
          <div key={i} className="prescription-card">
            <div className="prescription-header">
              <div className="prescription-info">
                <h4 className="prescription-name">{item.name}</h4>
                <p className="prescription-frequency">{item.frequency}</p>
              </div>
              <button className="prescription-menu" onClick={item.onMenu} aria-label="Options">
                ⋮
              </button>
            </div>

            <div className="prescription-schedule">
              {item.schedule.map((slot, j) => (
                <div key={j} className="prescription-schedule-item">
                  <p className="prescription-time">{slot.time}</p>
                  <p className="prescription-dose">{slot.dose}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
