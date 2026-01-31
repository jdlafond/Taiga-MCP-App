import { ENV } from '../config/env';
import { LoginCredentials, TaigaLoginResponse } from '../models/AuthModels';
import { HttpClient } from './HttpClient';
import { AuthError } from '../utils/errors';

class TaigaApiService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient(ENV.TAIGA_BASE_URL);
  }

  async login(credentials: LoginCredentials): Promise<TaigaLoginResponse> {
    try {
      const response = await this.client.post<TaigaLoginResponse>('/api/v1/auth', {
        ...credentials,
        type: credentials.type || 'normal',
      });
      return response;
    } catch (error) {
      throw new AuthError('Login failed. Check your credentials.');
    }
  }

  async getProjects(userId: number, authToken: string): Promise<any[]> {
    try {
      return await this.client.get<any[]>(
        `/api/v1/projects?member=${userId}`,
        { Authorization: `Bearer ${authToken}` }
      );
    } catch (error) {
      throw new AuthError('Failed to fetch projects.');
    }
  }

  async getMilestones(projectId: number, authToken: string): Promise<any[]> {
    try {
      return await this.client.get<any[]>(
        `/api/v1/milestones?project=${projectId}`,
        { Authorization: `Bearer ${authToken}` }
      );
    } catch (error) {
      throw new AuthError('Failed to fetch milestones.');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ auth_token: string; refresh: string }> {
    try {
      const response = await this.client.post<{ auth_token: string; refresh: string }>(
        '/api/v1/auth/refresh',
        { refresh: refreshToken }
      );
      return response;
    } catch (error) {
      throw new AuthError('Token refresh failed. Please login again.');
    }
  }
}

export const TaigaApi = new TaigaApiService();
