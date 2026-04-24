import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Default Azure AD group → GOP role mapping ────────────────────────────────
export const DEFAULT_GROUP_MAPPING: Record<string, string> = {
  'GOP_Insurance': 'INSURANCE_STAFF',
  'GOP_Finance':   'FINANCE',
  'GOP_Doctor':    'DOCTOR',
  'GOP_ITAdmin':   'IT_ADMIN',
}

// ── Valid GOP roles ───────────────────────────────────────────────────────────
const VALID_ROLES = ['INSURANCE_STAFF', 'FINANCE', 'DOCTOR', 'IT_ADMIN'] as const
export type GOPRole = (typeof VALID_ROLES)[number]

/**
 * Given an array of Azure AD group displayNames, returns the first role found
 * in the mapping, or null if none match.
 */
export function getRoleFromGroups(
  groups: string[],
  mapping: Record<string, string>
): string | null {
  for (const group of groups) {
    const role = mapping[group]
    if (role && isValidRole(role)) return role
  }
  return null
}

/** Returns true if the given string is a valid GOP system role. */
export function isValidRole(role: string): role is GOPRole {
  return (VALID_ROLES as readonly string[]).includes(role)
}

// ── Zustand store (client-side, persisted to localStorage) ───────────────────

interface SSOConfigState {
  groupMapping: Record<string, string>
  itContactEmail: string
  setGroupMapping: (mapping: Record<string, string>) => void
  setItContactEmail: (email: string) => void
  resetToDefaults: () => void
}

export const useSSOConfigStore = create<SSOConfigState>()(
  persist(
    (set) => ({
      groupMapping:   DEFAULT_GROUP_MAPPING,
      itContactEmail: 'admin@intercare.com',
      setGroupMapping:   (mapping) => set({ groupMapping: mapping }),
      setItContactEmail: (email)   => set({ itContactEmail: email }),
      resetToDefaults:   ()        => set({ groupMapping: DEFAULT_GROUP_MAPPING }),
    }),
    { name: 'gop-sso-config' }
  )
)
