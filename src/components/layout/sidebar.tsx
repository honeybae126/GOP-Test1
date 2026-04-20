'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  PlusCircle,
  ClipboardCheck,
  Settings,
  LogOut,
  Stethoscope,
  BarChart3,
  UserSearch,
  SlidersHorizontal,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { NotificationBell } from '@/components/notifications/notification-bell'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',            href: '/',                 icon: LayoutDashboard,  roles: ['INSURANCE_STAFF', 'IT_ADMIN'] },
  { label: 'Patients',             href: '/patients',         icon: Users,            roles: ['INSURANCE_STAFF', 'IT_ADMIN'] },
  { label: 'GOP Requests',         href: '/gop',              icon: FileText,         roles: ['INSURANCE_STAFF', 'FINANCE', 'IT_ADMIN'] },
  { label: 'New GOP Request',      href: '/gop/new',          icon: PlusCircle,       roles: ['INSURANCE_STAFF', 'IT_ADMIN'] },
  { label: 'Finance',              href: '/finance',          icon: BarChart3,        roles: ['INSURANCE_STAFF', 'FINANCE', 'IT_ADMIN'] },
  { label: 'My Patients',          href: '/dashboard/doctor', icon: Stethoscope,      roles: ['DOCTOR'] },
  { label: 'Patient Search',       href: '/patients/doctor',  icon: UserSearch,       roles: ['DOCTOR'] },
  { label: 'My Assigned Requests', href: '/gop',              icon: ClipboardCheck,   roles: ['DOCTOR'] },
  { label: 'SSO Configuration',    href: '/admin/config',     icon: SlidersHorizontal,roles: ['IT_ADMIN'] },
]

function getRoleLabel(role: string) {
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

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const role = user.role || ''
  const visibleItems = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role))

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex flex-col"
      style={{ width: 240, background: 'var(--bg-base)', borderRight: '1px solid var(--border-light)' }}>

      {/* Brand */}
      <div className="flex items-center gap-[10px] px-[20px] flex-shrink-0"
        style={{ height: 72, borderBottom: '1px solid var(--border-light)' }}>
        <div className="flex items-center justify-center flex-shrink-0"
          style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--blue-600)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="6.5" y="1" width="5" height="16" rx="1.5" fill="white" />
            <rect x="1" y="6.5" width="16" height="5" rx="1.5" fill="white" />
          </svg>
        </div>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-800)' }}>Intercare</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>GOP System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '16px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 8px 4px' }}>
          Main Menu
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon
          const base = item.href.split('?')[0]
          const isActive =
            pathname === base ||
            (base !== '/' && pathname.startsWith(base + '/') &&
              !visibleItems.some(o => o.href !== item.href && pathname === o.href.split('?')[0]))

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                'flex items-center gap-[10px] mb-[2px] px-[10px] group transition-all duration-[120ms] no-underline',
                isActive ? 'rounded-[8px]' : 'rounded-[8px] hover:bg-[rgba(45,107,244,0.07)]'
              )}
              style={{
                height: 40,
                background: isActive ? 'var(--bg-card)' : undefined,
                boxShadow: isActive ? 'var(--shadow-card)' : undefined,
              }}
            >
              <Icon
                className={cn(
                  'flex-shrink-0 transition-colors duration-[120ms]',
                  isActive ? 'text-[var(--blue-600)]' : 'text-[var(--gray-400)] group-hover:text-[var(--blue-600)]'
                )}
                style={{ width: 16, height: 16 }}
              />
              <span
                className={cn(
                  'flex-1 truncate transition-all duration-[120ms]',
                  isActive
                    ? 'text-[var(--gray-800)] font-[600]'
                    : 'text-[var(--gray-500)] font-[400] group-hover:text-[var(--gray-700)] group-hover:font-[500]'
                )}
                style={{ fontSize: 13 }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* System section */}
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 8px 8px' }}>
          System
        </div>
        {(() => {
          const isActive = pathname === '/settings'
          return (
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-[10px] mb-[2px] px-[10px] group transition-all duration-[120ms] no-underline rounded-[8px]',
                !isActive && 'hover:bg-[rgba(45,107,244,0.07)]'
              )}
              style={{
                height: 40,
                background: isActive ? 'var(--bg-card)' : undefined,
                boxShadow: isActive ? 'var(--shadow-card)' : undefined,
              }}
            >
              <Settings
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-[var(--blue-600)]' : 'text-[var(--gray-400)] group-hover:text-[var(--blue-600)]'
                )}
                style={{ width: 16, height: 16 }}
              />
              <span
                className={cn(
                  isActive ? 'text-[var(--gray-800)] font-[600]' : 'text-[var(--gray-500)] group-hover:text-[var(--gray-700)]'
                )}
                style={{ fontSize: 13 }}
              >
                Settings
              </span>
            </Link>
          )
        })()}
      </nav>

      {/* User */}
      <div className="flex-shrink-0" style={{ padding: '12px 16px 20px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-base)' }}>
        <div className="flex items-center gap-[10px]">
          <div className="flex-shrink-0 flex items-center justify-center"
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-100)', color: 'var(--blue-700)', fontSize: 13, fontWeight: 600 }}>
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', lineHeight: 1 }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
              {getRoleLabel(role)}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <NotificationBell />
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              title="Sign out"
              className="flex items-center justify-center transition-all duration-[150ms] hover:bg-[var(--bg-card)] hover:shadow-[var(--shadow-card)]"
              style={{ width: 30, height: 30, border: '1px solid var(--border-light)', borderRadius: 8, background: 'transparent', cursor: 'pointer', color: 'var(--gray-400)' }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
