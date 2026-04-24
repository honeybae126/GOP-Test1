'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, PlusCircle, ClipboardCheck,
  Settings, Stethoscope, BarChart3, UserSearch, SlidersHorizontal,
  ArrowRight, Command,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useActiveRole } from '@/hooks/useActiveRole'

/* ── Context ─────────────────────────────────────────────── */
interface CmdCtx { open: () => void; close: () => void }
const Ctx = createContext<CmdCtx>({ open: () => {}, close: () => {} })
export const useCommandPalette = () => useContext(Ctx)

/* ── Nav items (same source of truth as sidebar) ─────────── */
interface CmdItem {
  label: string
  description: string
  href: string
  icon: React.ElementType
  roles?: string[]
  keywords?: string[]
}

const CMD_ITEMS: CmdItem[] = [
  { label: 'Dashboard',            description: 'Operational overview',            href: '/',                 icon: LayoutDashboard,   roles: ['INSURANCE_STAFF','IT_ADMIN'],           keywords: ['home','overview','stats'] },
  { label: 'Patients',             description: 'Search and manage patients',      href: '/patients',         icon: Users,             roles: ['INSURANCE_STAFF','IT_ADMIN'],           keywords: ['search','patient'] },
  { label: 'GOP Requests',         description: 'All pre-authorisation requests',  href: '/gop',              icon: FileText,          roles: ['INSURANCE_STAFF','FINANCE','IT_ADMIN'], keywords: ['gop','list','requests'] },
  { label: 'New GOP Request',      description: 'Create a new GOP request',        href: '/gop/new',          icon: PlusCircle,        roles: ['INSURANCE_STAFF','IT_ADMIN'],           keywords: ['create','new','gop'] },
  { label: 'Finance',              description: 'Finance overview and summaries',  href: '/finance',          icon: BarChart3,         roles: ['INSURANCE_STAFF','FINANCE','IT_ADMIN'], keywords: ['finance','cost','revenue'] },
  { label: 'My Patients',          description: 'Doctor patient dashboard',        href: '/dashboard/doctor', icon: Stethoscope,       roles: ['DOCTOR'],                              keywords: ['my','patients','ward'] },
  { label: 'Patient Search',       description: 'Search patients by ward/doctor',  href: '/patients/doctor',  icon: UserSearch,        roles: ['DOCTOR'],                              keywords: ['search','patient'] },
  { label: 'My Assigned Requests', description: 'GOP requests assigned to you',   href: '/gop',              icon: ClipboardCheck,    roles: ['DOCTOR'],                              keywords: ['assigned','gop','mine'] },
  { label: 'SSO Configuration',    description: 'IT Admin — SSO group mappings',  href: '/admin/config',     icon: SlidersHorizontal, roles: ['IT_ADMIN'],                            keywords: ['sso','admin','config'] },
  { label: 'Settings',             description: 'Account and system settings',     href: '/settings',         icon: Settings,          keywords: ['settings','account','preferences'] },
]

function fuzzy(query: string, text: string) {
  const q = query.toLowerCase()
  return text.toLowerCase().includes(q)
}

/* ── Provider ────────────────────────────────────────────── */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open  = useCallback(() => setIsOpen(true),  [])
  const close = useCallback(() => setIsOpen(false), [])

  /* Global keyboard shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {isOpen && <CommandPalette onClose={close} />}
    </Ctx.Provider>
  )
}

/* ── Modal ───────────────────────────────────────────────── */
function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { data: session } = useSession()
  const role = useActiveRole()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  const items = CMD_ITEMS.filter(item => {
    if (item.roles && role && !item.roles.includes(role)) return false
    if (!query) return true
    return (
      fuzzy(query, item.label) ||
      fuzzy(query, item.description) ||
      item.keywords?.some(k => fuzzy(query, k))
    )
  })

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setActive(0) }, [query])

  const go = (href: string) => {
    router.push(href)
    onClose()
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, items.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && items[active]) go(items[active].href)
  }

  /* Scroll active item into view */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,19,39,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        style={{
          width: '100%', maxWidth: 560, margin: '0 16px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          animation: 'cmdIn 150ms cubic-bezier(0.16,1,0.3,1) forwards',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px',
          borderBottom: items.length > 0 ? '1px solid var(--border-light)' : undefined,
        }}>
          <Command style={{ width: 16, height: 16, color: 'var(--gray-400)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search pages, actions…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 15, color: 'var(--gray-800)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ fontSize: 11, color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}
              className="hover:bg-[var(--gray-100)] hover:text-[var(--gray-600)]"
            >
              Clear
            </button>
          )}
          <kbd style={{
            fontSize: 10, fontWeight: 600, padding: '3px 6px',
            borderRadius: 4, border: '1px solid var(--border-medium)',
            color: 'var(--gray-400)', lineHeight: 1.4, flexShrink: 0,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        {items.length > 0 && (
          <div ref={listRef} style={{ padding: '6px', maxHeight: 360, overflowY: 'auto' }}>
            {!query && (
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-400)', padding: '4px 10px 6px' }}>
                Navigation
              </div>
            )}
            {items.map((item, idx) => {
              const Icon = item.icon
              const isActive = idx === active
              return (
                <div
                  key={`${item.href}-${item.label}`}
                  data-idx={idx}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => go(item.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 10px', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', transition: 'background 80ms',
                    background: isActive ? 'var(--blue-50)' : 'transparent',
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: isActive ? 'var(--blue-100)' : 'var(--gray-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon style={{ width: 14, height: 14, color: isActive ? 'var(--blue-600)' : 'var(--gray-500)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--blue-700)' : 'var(--gray-800)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 1 }}>
                      {item.description}
                    </div>
                  </div>
                  <ArrowRight style={{ width: 13, height: 13, color: isActive ? 'var(--blue-400)' : 'var(--gray-300)', flexShrink: 0 }} />
                </div>
              )
            })}
          </div>
        )}

        {items.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--gray-400)' }}>
            No results for <strong style={{ color: 'var(--gray-600)' }}>"{query}"</strong>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '8px 16px', borderTop: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--gray-50)',
        }}>
          {[['↑↓', 'navigate'], ['↵', 'go'], ['esc', 'close']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <kbd style={{ fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border-medium)', background: 'white', color: 'var(--gray-500)', lineHeight: 1.4 }}>
                {key}
              </kbd>
              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
