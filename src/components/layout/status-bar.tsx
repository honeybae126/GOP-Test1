'use client'

import { useEffect, useState } from 'react'

interface StatusBarProps {
  userName: string
}

export function StatusBar({ userName }: StatusBarProps) {
  const [now, setNow] = useState('')

  useEffect(() => {
    const fmt = () => {
      const d = new Date()
      setNow(
        d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        '  ' +
        d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      )
    }
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="his-status-bar">
      <span className="his-status-bar-item">
        <i className="fas fa-user" style={{ marginRight: 5, opacity: 0.7 }} />
        {userName}
      </span>
      <span className="his-status-bar-sep" />
      <span className="his-status-bar-item">GOP Automation System</span>
      <span className="his-status-bar-sep" />
      <span className="his-status-bar-item">Intercare Hospital</span>
      <span className="his-status-bar-item right">{now}</span>
    </div>
  )
}
