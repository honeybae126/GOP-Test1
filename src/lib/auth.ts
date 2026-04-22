import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

const ROLE_PRIORITY = ['IT_ADMIN', 'INSURANCE_STAFF', 'DOCTOR', 'FINANCE']

const DEMO_USERS: Record<string, { name: string; role: string }> = {
  'staff@intercare.com':   { name: 'Demo Staff',         role: 'INSURANCE_STAFF' },
  'doctor@intercare.com':  { name: 'Dr. Sarah Mitchell', role: 'DOCTOR'          },
  'finance@intercare.com': { name: 'Demo Finance',       role: 'FINANCE'         },
  'admin@intercare.com':   { name: 'Demo Admin',         role: 'IT_ADMIN'        },
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: 'microsoft-entra-id',
      name: 'Microsoft',
      type: 'oidc',
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      clientId:     process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      wellKnown: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
      authorization: {
        url: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
        params: {
          scope: 'openid profile email User.Read',
        },
      },
      token: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
      userinfo: 'https://graph.microsoft.com/oidc/userinfo',
      profile(profile: any) {
        return {
          id:    profile.sub,
          name:  profile.name,
          email: profile.email ?? profile.preferred_username,
          image: null,
          roles: profile.roles ?? [],
        }
      },
    },
    ...(process.env.DEMO_AUTH_ENABLED === 'true' ? [
      Credentials({
        name: 'Demo Credentials',
        credentials: {
          email:    { label: 'Email',    type: 'email'    },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          const email    = credentials?.email as string
          const password = credentials?.password as string
          if (password !== 'gop123') return null
          const user = DEMO_USERS[email]
          if (!user) return null
          return { id: email, email, name: user.name, role: user.role }
        },
      })
    ] : []),
  ],

  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === 'microsoft-entra-id') {
        const roles: string[] = (profile as any)?.roles ?? []
        const role = ROLE_PRIORITY.find(r => roles.includes(r))
        token.role = role ?? 'NO_ROLE'
        token.name = (profile as any)?.name ?? token.name
      }
      if (user && (user as any).role) {
        token.role = (user as any).role
      }
      return token
    },

    async session({ session, token }) {
      session.user.role = token.role as string
      session.user.id   = token.sub ?? ''
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/error',
  },

  session: { strategy: 'jwt' },
})