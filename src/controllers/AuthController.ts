import { LoginCredentials, TaigaLoginResponse, UserContext, StoredTokens } from '../models/AuthModels';
import { TaigaApi } from '../services/TaigaApi';
import { SecureStoreService } from '../storage/SecureStore';
import { LocalStoreService } from '../storage/LocalStore';
import { ValidationError } from '../utils/errors';
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

    const projects = await TaigaApi.getProjects(response.id, response.auth_token);

    const userContext: UserContext = {
      id: response.id,
      username: response.username,
      email: response.email,
      roles: response.roles,
      uuid: response.uuid,
      full_name: response.full_name,
      full_name_display: response.full_name_display,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
      })),
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

    const newTokens = await TaigaApi.refreshToken(tokens.refresh);
    await SecureStoreService.saveTokens(newTokens);
    
    logger.info('Token refreshed successfully');
    return newTokens;
  }
}
