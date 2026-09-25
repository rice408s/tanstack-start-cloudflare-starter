import { emailOTPClient, oneTapClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { appConfig } from '@/config/app-config'

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    oneTapClient({
      clientId: appConfig.googleClientId,
      autoSelect: false,
      context: 'signin',
    }),
  ],
})
