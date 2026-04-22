import React from 'react'
import { HeaderBar } from './header-bar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div>
      <HeaderBar title={title || 'Dashboard'} subtitle={subtitle} />
      <main>{children}</main>
    </div>
  )
}
