import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'


export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#E8ECF4'
    }}>
      {/* SIDEBAR */}
      <aside style={{
        width: '240px',
        minWidth: '240px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: '#E8ECF4',
        borderRight: '1px solid #D8DEF0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40
      }}>
        <Sidebar user={session.user} />
      </aside>

      {/* MAIN AREA */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        backgroundColor: '#E8ECF4'
      }}>
        {/* TOP HEADER */}
        <header style={{
          height: '72px',
          minHeight: '72px',
          backgroundColor: 'var(--bg-base)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          justifyContent: 'space-between'
        }}>
        </header>

        {/* PAGE CONTENT */}
        <main style={{
          flex: 1,
          padding: '32px',
          overflow: 'auto'
        }}>
          {children}
        </main>
      </div>
    </div>
  )

}
