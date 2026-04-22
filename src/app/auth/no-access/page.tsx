import { signOut } from '@/lib/auth'

export default function NoAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Access not granted</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your Microsoft account has not been assigned a role in the GOP Automation System.
          Please contact your IT administrator to request access.
        </p>
        <p className="text-gray-400 text-xs mb-6">
          Roles required: Insurance Staff · Doctor · Finance · IT Admin
        </p>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/auth/signin' })
          }}
        >
          <button
            type="submit"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900"
          >
            Sign out and try another account
          </button>
        </form>
      </div>
    </div>
  )
}

