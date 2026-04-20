import NextAuth from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import Credentials from 'next-auth/providers/credentials'
import type { DefaultSession } from 'next-auth'
import { DEFAULT_GROUP_MAPPING, getRoleFromGroups } from './sso-config'

// ── NextAuth type augmentation ────────────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      accessDenied?: boolean
    } & DefaultSession['user']
  }

}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string | null
    accessDenied?: boolean
  }
}

// ── Graph API helper ──────────────────────────────────────────────────────────

async function fetchUserGroups(accessToken: string): Promise<string[]> {
  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.value ?? [])
      .map((g: { displayName?: string }) => g.displayName)
      .filter(Boolean) as string[]
  } catch {
    return []
  }
}

// ── NextAuth config ───────────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // ── Microsoft Entra ID (primary, production path) ─────────────────────
    MicrosoftEntraID({
      clientId:     process.env.ENTRA_ID_CLIENT_ID,
      clientSecret: process.env.ENTRA_ID_CLIENT_SECRET,
      // @ts-expect-error tenantId not in OIDCUserConfig typedefs but accepted at runtime
      tenantId:     process.env.ENTRA_ID_TENANT_ID,
      authorization: {
        params: {
          scope:
            'openid profile email https://graph.microsoft.com/GroupMember.Read.All',
        },
      },
    }),

    // ── Credentials (demo / development only) ─────────────────────────────
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const demos: Record<string, { id: string; name: string; role: string }> = {
          'staff@intercare.com':   { id: 'mock-staff-id',   name: 'Insurance Staff',   role: 'INSURANCE_STAFF' },
          'finance@intercare.com': { id: 'mock-finance-id', name: 'Finance Officer',   role: 'FINANCE'         },
          'doctor@intercare.com':  { id: 'mock-doctor-id',  name: 'Dr. Sok Phearith', role: 'DOCTOR'          },
          'admin@intercare.com':   { id: 'mock-admin-id',   name: 'IT Administrator', role: 'IT_ADMIN'         },
        }
        const email    = credentials?.email    as string
        const password = credentials?.password as string
        if (password === 'gop123' && demos[email]) {
          return { ...demos[email], email }
        }
        return null
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user, account }) {
      // Credentials provider — role is already on the user object
      if (user?.role) {
        token.role = user.role
      }

      // Microsoft Entra ID — call Graph API to resolve group → role
      if (account?.provider === 'microsoft-entra-id' && account.access_token) {
        const groups = await fetchUserGroups(account.access_token as string)
        // TODO Phase 2: load mapping from DB via API instead of DEFAULT_GROUP_MAPPING
        const role = getRoleFromGroups(groups, DEFAULT_GROUP_MAPPING)
        if (role) {
          token.role         = role
          token.accessDenied = false
        } else {
          token.role         = null
          token.accessDenied = true
        }
      }

      return token
    },

    session({ session, token }) {
      if (token) {
        session.user.id           = token.sub as string
        session.user.role         = (token.role ?? '') as string
        session.user.email        = token.email as string
        session.user.name         = token.name  as string
        session.user.accessDenied = token.accessDenied
      }
      return session
    },

    signIn() {
      // Access-denied redirect handled in middleware via req.auth.user.accessDenied
      return true
    },
  },

  pages: { signIn: '/auth/signin' },
})
