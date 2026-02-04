import { AgentRequest, AgentResponse } from '../models/AgentModels';
import { UserContext, StoredTokens } from '../models/AuthModels';
import { AgentApi } from '../services/AgentApi';
import { AuthController } from './AuthController';
import { ValidationError, AuthError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AgentController {
  static async runAgent(
    projectId: number,
    sprintId: number,
    prompt: string,
    tokens: StoredTokens,
    userContext: UserContext,
    userStoryId?: number
  ): Promise<AgentResponse> {
    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }
    if (!sprintId) {
      throw new ValidationError('Sprint ID is required');
    }
    if (!prompt?.trim()) {
      throw new ValidationError('Prompt is required');
    }

    const request: AgentRequest = {
      project_id: projectId,
      milestone_id: sprintId,
      prompt,
      auth_token: tokens.auth_token,
      refresh: tokens.refresh,
      user_context: {
        id: userContext.id,
        username: userContext.username,
        email: userContext.email,
        roles: userContext.roles,
      },
      ...(userStoryId != null && userStoryId > 0 && { user_story_id: userStoryId }),
    };

    try {
      logger.info('Submitting agent request', { projectId, sprintId });
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
          throw new AuthError('Session expired. Please login again.');
        }
      }

      throw error;
    }
  }
}