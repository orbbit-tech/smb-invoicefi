/**
 * Auth Provider Error Classes
 *
 * Error handling for authentication providers like Stytch
 */

export class AuthProviderError extends Error {
  constructor(
    public readonly errorType: string,
    public readonly errorMessage: string,
  ) {
    super(errorMessage);
    this.name = 'AuthProviderError';
  }
}

export class AuthProviderUnknownError extends Error {
  constructor(public readonly originalError: unknown) {
    super(
      originalError instanceof Error
        ? originalError.message
        : 'Unknown auth provider error',
    );
    this.name = 'AuthProviderUnknownError';
  }
}
