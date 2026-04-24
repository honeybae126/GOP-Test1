'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:   'There is a problem with the server configuration.',
  AccessDenied:    'You do not have permission to sign in.',
  Verification:    'The sign in link is no longer valid.',
  OAuthSignin:     'Could not start the Microsoft sign in process.',
  OAuthCallback:   'Could not complete the Microsoft sign in process.',
  OAuthCreateAccount: 'Could not create your account.',
  Default:         'An unexpected error occurred during sign in.',
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const errorCode    = searchParams.get('error') ?? 'Default'
  const message      = ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign in failed</h1>
        <p className="text-gray-500 text-sm mb-2">{message}</p>
        <p className="text-gray-400 text-xs mb-6">Error code: {errorCode}</p>
        <button
          onClick={() => router.push('/auth/signin')}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900"
        >
          Back to sign in
        </button>
      </div>
    </div>
  )
}

