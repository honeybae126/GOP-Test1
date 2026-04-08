import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'

export async function Navbar() {
  const session = await auth()
  const user = session?.user

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 font-bold text-xl flex items-center gap-2">
          GOP System
        </Link>
        <div className="flex items-center space-x-4 ml-auto">
          {user ? (
            <Badge variant="secondary">{user.role}</Badge>
          ) : (
            <Link href="/auth/signin" className="text-sm underline">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

