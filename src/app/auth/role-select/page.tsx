'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { FlaskConical } from 'lucide-react'

const DEMO_ROLE_KEY = 'gop-demo-role'

const ALL_ROLES = [
  {
    value: 'IT_ADMIN',
    label: 'IT Admin',
    description: 'Full access — all modules, all requests, user management',
    icon: '🛡️',
    color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  {
    value: 'INSURANCE_STAFF',
    label: 'Insurance Staff',
    description: 'Create & manage GOP requests, patient search, submit to insurers',
    icon: '📋',
    color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    value: 'DOCTOR',
    label: 'Doctor',
    description: 'Clinical verification of assigned GOP requests only',
    icon: '🩺',
    color: 'border-green-200 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/30',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  {
    value: 'FINANCE',
    label: 'Finance',
    description: 'Cost review, finance dashboard, confirm finance verification',
    icon: '💰',
    color: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
]

const ROLE_REDIRECTS: Record<string, string> = {
  IT_ADMIN:         '/',
  INSURANCE_STAFF:  '/',
  DOCTOR:           '/dashboard/doctor',
  FINANCE:          '/finance',
}

export default function RoleSelectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // If not authenticated, redirect to sign in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  function selectRole(role: string) {
    localStorage.setItem(DEMO_ROLE_KEY, role)
    router.push(ROLE_REDIRECTS[role] ?? '/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Intercare Hospital
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            GOP Automation System
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <FlaskConical className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              Demo mode — signed in as {session?.user?.name}
            </span>
          </div>
        </div>

        {/* Role picker */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
            Which role would you like to enter as?
          </p>
          <div className="grid grid-cols-1 gap-3">
            {ALL_ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => selectRole(role.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 bg-white dark:bg-gray-900 transition-all text-left ${role.color}`}
              >
                <div className="text-2xl flex-shrink-0">{role.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {role.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.badge}`}>
                      {role.value}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {role.description}
                  </p>
                </div>
                <div className="text-gray-300 dark:text-gray-600 flex-shrink-0">→</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sign out link */}
        <p className="text-center text-xs text-gray-400">
          Not you?{' '}
          <button
            onClick={() => {
              localStorage.removeItem(DEMO_ROLE_KEY)
              router.push('/auth/signin')
            }}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  )
}
