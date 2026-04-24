interface HeaderBarProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function HeaderBar({ title, subtitle, children }: HeaderBarProps) {
  return (
    <div className="dashboard-header">
      <div>
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {children}
        </div>
      )}
    </div>
  )
}
