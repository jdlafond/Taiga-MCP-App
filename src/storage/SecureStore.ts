import * as SecureStore from 'expo-secure-store';
import { StoredTokens } from '../models/AuthModels';
import { logger } from '../utils/logger';

const TOKENS_KEY = 'taiga_tokens';

export const SecureStoreService = {
  async saveTokens(tokens: StoredTokens): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
      logger.info('Tokens saved securely');
    } catch (error) {
      logger.error('Failed to save tokens', error);
      throw error;
    }
  },

  async getTokens(): Promise<StoredTokens | null> {
    try {
      const tokens = await SecureStore.getItemAsync(TOKENS_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      logger.error('Failed to retrieve tokens', error);
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKENS_KEY);
      logger.info('Tokens cleared');
    } catch (error) {
      logger.error('Failed to clear tokens', error);
    }
  },
};
