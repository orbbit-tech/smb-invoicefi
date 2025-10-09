export const AUTH_CONFIG = {
  // Redirect URLs after authentication
  LOGIN_REDIRECT: '/',
  LOGOUT_REDIRECT: '/auth',

  // Session cookie configuration
  SESSION_COOKIE_NAME: 'orbbit_smb_session_jwt',

  // Auth flow steps
  AUTH_STEPS: {
    EMAIL: 'email',
    OTP: 'otp',
    CHOOSE_ORGANIZATION: 'choose-organization',
    CREATE_ORGANIZATION: 'create-organization',
  } as const,

  // OTP configuration
  OTP: {
    LENGTH: 6,
    RESEND_COOLDOWN_SECONDS: 60,
  },
} as const;
