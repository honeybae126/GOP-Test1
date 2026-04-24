import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { StatusBar } from '@/components/layout/status-bar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  return (
    <div className="dashboard-wrapper" style={{ flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar user={session.user} />
        <div className="dashboard-main">
          <div className="dashboard-content">
            {children}
          </div>
        </div>
      </div>
      <StatusBar userName={session.user.name ?? session.user.email ?? 'User'} />
    </div>
  )
}
