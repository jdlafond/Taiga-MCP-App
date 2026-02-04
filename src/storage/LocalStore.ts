import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../models/AuthModels';
import { logger } from '../utils/logger';

const USER_CONTEXT_KEY = 'user_context';
const AGENT_CONTEXT_KEY = 'agent_context';

export type AgentContext = { projectId: number; milestoneId: number | null; userStoryId?: number };

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

  async getAgentContext(): Promise<AgentContext | null> {
    try {
      const raw = await AsyncStorage.getItem(AGENT_CONTEXT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AgentContext;
      return typeof parsed?.projectId === 'number'
        ? parsed
        : null;
    } catch {
      return null;
    }
  },

  async saveAgentContext(ctx: AgentContext): Promise<void> {
    try {
      await AsyncStorage.setItem(AGENT_CONTEXT_KEY, JSON.stringify(ctx));
    } catch (error) {
      logger.error('Failed to save agent context', error);
    }
  },
};
