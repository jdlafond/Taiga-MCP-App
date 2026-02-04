import { LoginCredentials, TaigaLoginResponse, UserContext, StoredTokens } from '../models/AuthModels';
import { TaigaApi } from '../services/TaigaApi';
import { SecureStoreService } from '../storage/SecureStore';
import { LocalStoreService } from '../storage/LocalStore';
import { ValidationError, NetworkError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AuthController {
  static async login(credentials: LoginCredentials): Promise<TaigaLoginResponse> {
    if (!credentials.username?.trim()) {
      throw new ValidationError('Username is required');
    }
    if (!credentials.password?.trim()) {
      throw new ValidationError('Password is required');
    }

    const response = await TaigaApi.login(credentials);

    await SecureStoreService.saveTokens({
      auth_token: response.auth_token,
      refresh: response.refresh,
    });

    const userContext: UserContext = {
      id: response.id,
      username: response.username,
      email: response.email,
      roles: response.roles,
    };
    await LocalStoreService.saveUserContext(userContext);

    logger.info('Login successful', { username: response.username });
    return response;
  }

  static async logout(): Promise<void> {
    await SecureStoreService.clearTokens();
    await LocalStoreService.clearUserContext();
    logger.info('Logout successful');
  }

  static async loadStoredAuth(): Promise<{ tokens: StoredTokens; context: UserContext } | null> {
    const tokens = await SecureStoreService.getTokens();
    const context = await LocalStoreService.getUserContext();

    if (tokens && context) {
      return { tokens, context };
    }

    return null;
  }

  static async refreshToken(): Promise<StoredTokens> {
    const tokens = await SecureStoreService.getTokens();
    if (!tokens) {
      throw new ValidationError('No refresh token available');
    }

    try {
      const newTokens = await TaigaApi.refreshToken(tokens.refresh);
      await SecureStoreService.saveTokens(newTokens);
      logger.info('Token refreshed successfully');
      return newTokens;
    } catch (error) {
      logger.error('Token refresh failed, clearing stored tokens', error);
      await SecureStoreService.clearTokens();
      await LocalStoreService.clearUserContext();
      throw new ValidationError('Session expired. Please login again.');
    }
  }

  /**
   * Runs an async function with the current auth token. If the request fails with 401,
   * refreshes the token and retries once. Use this for any Taiga API call that uses the stored token.
   */
  static async withValidToken<T>(fn: (authToken: string) => Promise<T>): Promise<T> {
    const tokens = await SecureStoreService.getTokens();
    if (!tokens) {
      throw new ValidationError('Not logged in. Please login again.');
    }
    try {
      return await fn(tokens.auth_token);
    } catch (error) {
      const is401 = error instanceof NetworkError && error.statusCode === 401;
      if (!is401) throw error;
      logger.warn('Received 401, attempting token refresh');
      try {
        const newTokens = await AuthController.refreshToken();
        return fn(newTokens.auth_token);
      } catch (refreshError) {
        throw new ValidationError('Session expired. Please login again.');
      }
    }
  }
}
