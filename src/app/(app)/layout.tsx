import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { RightPanel } from '@/components/layout/right-panel'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  return (
    <div className="dashboard-wrapper">
      <Sidebar user={session.user} />
      <div className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </div>
      <RightPanel user={session.user} />
    </div>
  )
}
