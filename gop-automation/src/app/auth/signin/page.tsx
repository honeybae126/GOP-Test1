import { SignInForm } from './sign-in-form'

export default function SignInPage() {
  const ssoConfigured =
    !!process.env.ENTRA_ID_CLIENT_ID &&
    process.env.ENTRA_ID_CLIENT_ID !== '00000000-0000-0000-0000-000000000000' &&
    !!process.env.ENTRA_ID_CLIENT_SECRET &&
    process.env.ENTRA_ID_CLIENT_SECRET !== 'placeholder-secret'

  return <SignInForm ssoConfigured={ssoConfigured} />
}
