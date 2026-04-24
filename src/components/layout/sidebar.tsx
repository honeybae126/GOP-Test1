'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useActiveRole } from '@/hooks/useActiveRole'
import { DemoRoleSwitcher } from '@/components/demo-role-switcher'

export function getRoleLabel(role: string) {
  switch (role) {
    case 'INSURANCE_STAFF': return 'Insurance Staff'
    case 'DOCTOR':          return 'Doctor'
    case 'FINANCE':         return 'Finance'
    case 'IT_ADMIN':        return 'IT Admin'
    default:                return role
  }
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface NavItem {
  label: string
  href: string
  icon: string
  roles?: string[]
}

const NAV_MAIN: NavItem[] = [
  { label: 'Dashboard',       href: '/',                 icon: 'fas fa-th-large',    roles: ['INSURANCE_STAFF', 'IT_ADMIN'] },
  { label: 'My Patients',     href: '/dashboard/doctor', icon: 'fas fa-user-md',     roles: ['DOCTOR'] },
  { label: 'GOP Requests',    href: '/gop',              icon: 'fas fa-file-medical' },
  { label: 'New GOP Request', href: '/gop/new',          icon: 'fas fa-plus-circle', roles: ['INSURANCE_STAFF', 'IT_ADMIN'] },
  { label: 'Patients',        href: '/patients',         icon: 'fas fa-users',       roles: ['INSURANCE_STAFF', 'IT_ADMIN'] },
  { label: 'Finance',         href: '/finance',          icon: 'fas fa-chart-bar',   roles: ['INSURANCE_STAFF', 'IT_ADMIN', 'FINANCE'] },
  { label: 'Billing / Quotation', href: '/billing',      icon: 'fas fa-file-invoice-dollar', roles: ['INSURANCE_STAFF', 'IT_ADMIN', 'BILLING_STAFF'] },
]

const NAV_ADMIN: NavItem[] = [
  { label: 'User Management', href: '/admin/users',  icon: 'fas fa-user-cog',  roles: ['IT_ADMIN'] },
  { label: 'System Config',   href: '/admin/config', icon: 'fas fa-sliders-h', roles: ['IT_ADMIN'] },
  { label: 'Audit Log',       href: '/admin/audit',  icon: 'fas fa-history',   roles: ['IT_ADMIN'] },
]

interface SidebarProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const activeRole = useActiveRole()
  const role = activeRole || user.role || ''

  const visibleMain  = NAV_MAIN.filter(item => !item.roles || item.roles.includes(role))
  const visibleAdmin = NAV_ADMIN.filter(item => !item.roles || item.roles.includes(role))

  function isActive(href: string) {
    if (href === '/') return pathname === '/' || pathname === '/dashboard/doctor'
    return pathname.startsWith(href)
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href)
    return (
      <Link
        href={item.href}
        className={`sidebar-menu-item${active ? ' active' : ''}`}
      >
        <span className="sidebar-menu-item-icon">
          <i className={item.icon} />
        </span>
        <span className="sidebar-menu-item-label">{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">I</div>
        <div>
          <div className="sidebar-logo-text">Intercare</div>
          <div className="sidebar-logo-sub">GOP System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        <div className="sidebar-menu">
          {visibleMain.map(item => <NavLink key={item.href} item={item} />)}
        </div>

        {visibleAdmin.length > 0 && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">Administration</div>
            <div className="sidebar-menu">
              {visibleAdmin.map(item => <NavLink key={item.href} item={item} />)}
            </div>
          </>
        )}

        <div className="sidebar-divider" />
        <div className="sidebar-menu">
          <Link
            href="/settings"
            className={`sidebar-menu-item${isActive('/settings') ? ' active' : ''}`}
          >
            <span className="sidebar-menu-item-icon">
              <i className="fas fa-cog" />
            </span>
            <span className="sidebar-menu-item-label">Settings</span>
          </Link>
        </div>
      </nav>

      {/* User / sign-out */}
      <div className="sidebar-bottom">
        <DemoRoleSwitcher />
        <button
          className="sidebar-user"
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          title="Sign out"
        >
          <div className="sidebar-avatar">{getInitials(user.name)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name ?? 'User'}</div>
            <div className="sidebar-user-role">{getRoleLabel(role)}</div>
          </div>
          <i
            className="fas fa-arrow-right-from-bracket"
            style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', flexShrink: 0 }}
          />
        </button>
      </div>
    </aside>
  )
}

export const NAV_ITEMS = NAV_MAIN
