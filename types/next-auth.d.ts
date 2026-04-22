import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id:     string
      name:   string
      email:  string
      image?: string
      // 'INSURANCE_STAFF' | 'DOCTOR' | 'FINANCE' | 'IT_ADMIN' | 'NO_ROLE'
      role:   string
    }
  }

  interface User {
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    sub?:  string
  }
}
