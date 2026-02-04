import { AgentRequest, AgentResponse } from '../models/AgentModels';
import { UserContext, StoredTokens } from '../models/AuthModels';
import { AgentApi } from '../services/AgentApi';
import { AuthController } from './AuthController';
import { ValidationError, AuthError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AgentController {
  static async runAgent(
    projectRef: string,
    sprintRef: string,
    prompt: string,
    tokens: StoredTokens,
    userContext: UserContext,
    userStoryId?: number
  ): Promise<AgentResponse> {
    if (!projectRef?.trim()) {
      throw new ValidationError('Project reference is required');
    }
    if (!sprintRef?.trim()) {
      throw new ValidationError('Sprint reference is required');
    }
    if (!prompt?.trim()) {
      throw new ValidationError('Prompt is required');
    }

    const request: AgentRequest = {
      project_ref: projectRef,
      sprint_ref: sprintRef,
      prompt,
      auth_token: tokens.auth_token,
      refresh: tokens.refresh,
      user_context: userContext,
      ...(userStoryId != null && userStoryId > 0 && { user_story_id: userStoryId }),
    };

    try {
      logger.info('Submitting agent request', { projectRef, sprintRef });
      const response = await AgentApi.runAgent(request);
      logger.info('Agent request completed');
      return response;
    } catch (error: any) {
      if (error.message?.includes('401')) {
        logger.warn('Received 401, attempting token refresh');
        try {
          const newTokens = await AuthController.refreshToken();
          request.auth_token = newTokens.auth_token;
          request.refresh = newTokens.refresh;
          
          logger.info('Retrying agent request with refreshed token');
          return await AgentApi.runAgent(request);
        } catch (refreshError) {
          throw new ValidationError('Session expired. Please login again.');
        }
      }
      
      throw error;
    }
  }
}
