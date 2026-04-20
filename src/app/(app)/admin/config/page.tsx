import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminConfigPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'IT_ADMIN') {
    redirect('/')
  }
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">SSO Configuration</h1>
      <p className="text-muted-foreground text-sm mb-8">Admin page placeholder - SSO config coming soon.</p>
      <div className="bg-muted p-6 rounded-xl border">
        IT Admin only page. SSO group mappings etc. here.
      </div>
    </div>
  )
}

