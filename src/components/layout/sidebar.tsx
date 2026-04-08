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
  Building2,
  ChevronRight,
  BarChart3,
  UserSearch,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { signOut } from 'next-auth/react'
import { NotificationBell } from '@/components/notifications/notification-bell'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  // Staff / Admin
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['INSURANCE_STAFF', 'ADMIN'] },
  { label: 'Patients', href: '/patients', icon: Users, roles: ['INSURANCE_STAFF', 'ADMIN'] },
  { label: 'GOP Requests', href: '/gop', icon: FileText, roles: ['INSURANCE_STAFF', 'ADMIN'] },
  { label: 'New GOP Request', href: '/gop/new', icon: PlusCircle, roles: ['INSURANCE_STAFF', 'ADMIN'] },
  { label: 'Finance', href: '/finance', icon: BarChart3, roles: ['INSURANCE_STAFF', 'ADMIN'] },
  // Doctor
  { label: 'My Patients', href: '/dashboard/doctor', icon: Stethoscope, roles: ['DOCTOR'] },
  { label: 'Patient Search', href: '/patients/doctor', icon: UserSearch, roles: ['DOCTOR'] },
  { label: 'My Assigned Requests', href: '/gop', icon: ClipboardCheck, roles: ['DOCTOR'] },
]

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'INSURANCE_STAFF': return 'bg-blue-100 text-blue-800'
    case 'DOCTOR': return 'bg-green-100 text-green-800'
    case 'ADMIN': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'INSURANCE_STAFF': return 'Insurance Staff'
    case 'DOCTOR': return 'Doctor'
    case 'ADMIN': return 'Admin'
    default: return role
  }
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const role = user.role || ''

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(role)
  )

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar fixed left-0 top-0 z-40">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <Building2 className="size-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-none">GOP System</span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Intercare Hospital</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        {visibleItems.map((item) => {
          const Icon = item.icon
          const baseHref = item.href.split('?')[0]
          const isActive =
            pathname === baseHref ||
            (baseHref !== '/' &&
              pathname.startsWith(baseHref + '/') &&
              !visibleItems.some(other => other.href !== item.href && pathname === other.href.split('?')[0]))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors group',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  {item.badge}
                </Badge>
              )}
              {isActive && <ChevronRight className="size-3 opacity-60" />}
            </Link>
          )
        })}

        <Separator className="my-2" />

        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          System
        </p>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Settings className="size-4 shrink-0" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none truncate">{user.name}</p>
            <p className={cn('text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-block font-medium', getRoleBadgeColor(role))}>
              {getRoleLabel(role)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              title="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
