'use client'

import { useSession, signOut } from 'next-auth/react'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSSOConfigStore } from '@/lib/sso-config'

const REQUIRED_GROUPS = ['GOP_Insurance', 'GOP_Finance', 'GOP_Doctor', 'GOP_ITAdmin']

export default function AccessDeniedPage() {
  const { data: session } = useSession()
  const itContactEmail    = useSSOConfigStore(s => s.itContactEmail)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="size-16 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldX className="size-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Access not granted</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Your Microsoft account is not assigned to a GOP system role. Please
              contact your IT administrator to request access.
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-lg border bg-white p-4 space-y-3 text-sm shadow-sm">
          {session?.user?.email && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground shrink-0">Your account:</span>
              <span className="font-mono font-medium break-all">{session.user.email}</span>
            </div>
          )}
          <div className="border-t pt-3">
            <p className="text-muted-foreground mb-2">
              Required: your account must be a member of one of these Azure AD groups:
            </p>
            <ul className="space-y-1">
              {REQUIRED_GROUPS.map(g => (
                <li key={g} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-slate-400 shrink-0" />
                  <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                    {g}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action */}
        <Button
          className="w-full"
          variant="outline"
          onClick={handleSignOut}
        >
          Sign in with a different account
        </Button>

        {/* IT contact */}
        <p className="text-xs text-center text-muted-foreground">
          IT Admin contact:{' '}
          <a href={`mailto:${itContactEmail}`} className="underline hover:text-foreground">
            {itContactEmail}
          </a>
        </p>
      </div>
    </div>
  )
}
