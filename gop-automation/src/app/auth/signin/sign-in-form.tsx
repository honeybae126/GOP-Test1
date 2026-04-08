'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, AlertTriangle, Stethoscope, Shield, User, Loader2 } from 'lucide-react'

const DEMO_USERS = [
  {
    email: 'staff@intercare.com',
    role: 'Insurance Staff',
    description: 'Create & manage GOP requests',
    icon: User,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    email: 'doctor@intercare.com',
    role: 'Doctor',
    description: 'Verify clinical sections',
    icon: Stethoscope,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    email: 'admin@intercare.com',
    role: 'Admin',
    description: 'Full system access',
    icon: Shield,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
]

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  )
}

export function SignInForm({ ssoConfigured }: { ssoConfigured: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleMicrosoft = async () => {
    setLoading('microsoft')
    setError('')
    await signIn('microsoft-entra-id', { callbackUrl: '/' })
  }

  const quickLogin = async (email: string) => {
    setLoading(email)
    setError('')
    const res = await signIn('credentials', {
      email,
      password: 'gop123',
      redirect: false,
    })
    if (res?.ok) {
      window.location.href = '/'
    } else {
      setError('Demo login failed.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="size-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
          <Building2 className="size-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-none">GOP Automation System</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Intercare Hospital · Phase 1</p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Microsoft SSO */}
            {ssoConfigured ? (
              <>
                <Button
                  className="w-full gap-2 bg-[#0078d4] hover:bg-[#106ebe] text-white"
                  onClick={handleMicrosoft}
                  disabled={!!loading}
                >
                  {loading === 'microsoft'
                    ? <Loader2 className="size-4 animate-spin" />
                    : <MicrosoftLogo />}
                  Sign in with Microsoft
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Use your Intercare Hospital Microsoft account
                </p>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-amber-700">
                  <MicrosoftLogo />
                  <span className="text-sm font-medium">Microsoft SSO not configured</span>
                </div>
                <p className="text-xs text-amber-600">
                  Set <code className="font-mono bg-amber-100 px-1 rounded">ENTRA_ID_CLIENT_ID</code>,{' '}
                  <code className="font-mono bg-amber-100 px-1 rounded">ENTRA_ID_CLIENT_SECRET</code>, and{' '}
                  <code className="font-mono bg-amber-100 px-1 rounded">ENTRA_ID_TENANT_ID</code> in <code className="font-mono bg-amber-100 px-1 rounded">.env</code> to enable.
                </p>
              </div>
            )}

            <Separator />

            {/* Demo accounts */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Demo Accounts
              </p>
              <div className="space-y-2">
                {DEMO_USERS.map(u => {
                  const Icon = u.icon
                  const isLoading = loading === u.email
                  return (
                    <button
                      key={u.email}
                      onClick={() => quickLogin(u.email)}
                      disabled={!!loading}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 text-left ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`size-8 rounded-full ${u.bg} flex items-center justify-center shrink-0`}>
                        {isLoading
                          ? <Loader2 className={`size-4 ${u.color} animate-spin`} />
                          : <Icon className={`size-4 ${u.color}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{u.role}</div>
                        <div className="text-xs text-muted-foreground">{u.description}</div>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono shrink-0">
                        {u.email.split('@')[0]}
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Demo accounts bypass Microsoft SSO · password: <code className="font-mono">gop123</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
