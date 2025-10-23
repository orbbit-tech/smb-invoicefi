import { AuthProviderUnknownError } from '../shared/auth/auth-provider.error';

export class StytchUnknownError extends AuthProviderUnknownError {
  constructor(originalError: unknown) {
    super(originalError);
    this.name = 'StytchUnknownError';
  }
}
