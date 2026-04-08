import { auth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  return auth(request as unknown as Parameters<typeof auth>[0])
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
