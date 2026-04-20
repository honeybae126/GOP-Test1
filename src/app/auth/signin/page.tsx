import { SignInForm } from './sign-in-form'

function isEnvConfigured(val: string | undefined, ...placeholders: string[]): boolean {
  return !!val && !placeholders.includes(val)
}

export default function SignInPage() {
  const ssoConfigured =
    isEnvConfigured(
      process.env.ENTRA_ID_CLIENT_ID,
      'placeholder',
      '00000000-0000-0000-0000-000000000000'
    ) &&
    isEnvConfigured(
      process.env.ENTRA_ID_CLIENT_SECRET,
      'placeholder',
      'placeholder-secret'
    ) &&
    isEnvConfigured(process.env.ENTRA_ID_TENANT_ID, 'placeholder')

  return <SignInForm ssoConfigured={ssoConfigured} />
}
