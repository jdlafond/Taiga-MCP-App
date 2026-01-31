import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../models/AuthModels';
import { logger } from '../utils/logger';

const USER_CONTEXT_KEY = 'user_context';

export const LocalStoreService = {
  async saveUserContext(context: UserContext): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(context));
      logger.info('User context saved');
    } catch (error) {
      logger.error('Failed to save user context', error);
      throw error;
    }
  },

  async getUserContext(): Promise<UserContext | null> {
    try {
      const context = await AsyncStorage.getItem(USER_CONTEXT_KEY);
      return context ? JSON.parse(context) : null;
    } catch (error) {
      logger.error('Failed to retrieve user context', error);
      return null;
    }
  },

  async clearUserContext(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_CONTEXT_KEY);
      logger.info('User context cleared');
    } catch (error) {
      logger.error('Failed to clear user context', error);
    }
  },
};
