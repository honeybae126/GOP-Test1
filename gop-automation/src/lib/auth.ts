import NextAuth from "next-auth"
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id"
import Credentials from "next-auth/providers/credentials"

// Maps Microsoft account email → hospital role.
// In production, replace with a DB lookup against UserMetadata.
const ROLE_REGISTRY: Record<string, string> = {
  "staff@intercare.com":   "INSURANCE_STAFF",
  "doctor@intercare.com":  "DOCTOR",
  "admin@intercare.com":   "ADMIN",
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // ── Microsoft Entra ID (primary, production path) ──────────────────────
    MicrosoftEntraId({
      clientId:     process.env.ENTRA_ID_CLIENT_ID     ?? "00000000-0000-0000-0000-000000000000",
      clientSecret: process.env.ENTRA_ID_CLIENT_SECRET ?? "placeholder-secret",
      issuer: `https://login.microsoftonline.com/${process.env.ENTRA_ID_TENANT_ID ?? "common"}/v2.0`,
    }),

    // ── Credentials (demo / development only) ─────────────────────────────
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const demos: Record<string, { id: string; name: string; role: string }> = {
          "staff@intercare.com":  { id: "mock-staff-id",  name: "Insurance Staff",  role: "INSURANCE_STAFF" },
          "doctor@intercare.com": { id: "mock-doctor-id", name: "Dr. Sok Phearith", role: "DOCTOR"           },
          "admin@intercare.com":  { id: "mock-admin-id",  name: "Admin User",       role: "ADMIN"            },
        }
        const email    = credentials?.email as string
        const password = credentials?.password as string
        if (password === "gop123" && demos[email]) {
          return { ...demos[email], email }
        }
        return null
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    jwt({ token, user, account }) {
      // Credentials provider — role already on the user object
      if (user?.role) {
        token.role = user.role
      }
      // Microsoft Entra ID — derive role from email via registry
      if (account?.provider === "microsoft-entra-id" && token.email) {
        token.role = ROLE_REGISTRY[token.email as string] ?? null
      }
      return token
    },

    session({ session, token }) {
      if (token) {
        session.user.id   = token.sub as string
        session.user.role = token.role as string
      }
      return session
    },

    // Block Microsoft users whose email is not in the registry
    signIn({ account, profile }) {
      if (account?.provider === "microsoft-entra-id") {
        const email = profile?.email ?? (profile as any)?.preferred_username ?? ""
        if (!ROLE_REGISTRY[email]) {
          // Not a recognised hospital account — deny access
          return false
        }
      }
      return true
    },
  },

  pages: { signIn: "/auth/signin" },
})
