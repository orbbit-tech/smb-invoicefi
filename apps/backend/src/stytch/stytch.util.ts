import { StytchError, RequestError } from 'stytch';
import { AuthProviderError } from '../shared/auth/auth-provider.error';
import { StytchUnknownError } from './stytch.error';

/**
 * Wrapper for Stytch API calls that handles errors consistently
 */
export async function callStytchApi<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error: unknown) {
    if (error instanceof StytchError) {
      throw new AuthProviderError(error.error_type, error.error_message);
    } else if (error instanceof RequestError) {
      throw new AuthProviderError('request_error', error.message);
    } else {
      throw new StytchUnknownError(error);
    }
  }
}
