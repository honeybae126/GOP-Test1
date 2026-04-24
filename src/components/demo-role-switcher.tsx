'use client'

import { useState } from 'react'
import { useDemoRole } from '@/hooks/useDemoRole'
import { ChevronDown, FlaskConical } from 'lucide-react'

const ALL_ROLES = [
  { value: 'IT_ADMIN',        label: 'IT Admin',         description: 'Full access to everything' },
  { value: 'INSURANCE_STAFF', label: 'Insurance Staff',  description: 'Create & manage GOP requests' },
  { value: 'DOCTOR',          label: 'Doctor',           description: 'Clinical verification only' },
  { value: 'FINANCE',         label: 'Finance',          description: 'Cost review & confirmation' },
]

export function DemoRoleSwitcher() {
  const isDemoEnabled = process.env.NEXT_PUBLIC_DEMO_AUTH_ENABLED === 'true'
  const { activeRole, switchRole, roleLabel, isDemoOverride } = useDemoRole()
  const [open, setOpen] = useState(false)

  if (!isDemoEnabled) return null

  return (
    <div className="relative px-3 pb-2">
      {/* Switcher button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-800 dark:text-amber-400 truncate">
            {roleLabel}
          </span>
          {isDemoOverride && (
            <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              override
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-amber-600 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Switch demo role</p>
          </div>
          {ALL_ROLES.map((role) => (
            <button
              key={role.value}
              onClick={() => {
                switchRole(role.value)
                setOpen(false)
              }}
              className={`w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                activeRole === role.value ? 'bg-blue-50 dark:bg-blue-950/30' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {role.label}
                  </span>
                  {activeRole === role.value && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                      active
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {role.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Demo mode label */}
      <p className="text-center text-xs text-amber-600 dark:text-amber-500 mt-1.5 font-medium">
        Demo mode
      </p>
    </div>
  )
}
