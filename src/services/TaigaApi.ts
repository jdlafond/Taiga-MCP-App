import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import { LoginCredentials, TaigaLoginResponse } from '../models/AuthModels';
import { HttpClient } from './HttpClient';
import { AuthError, NetworkError } from '../utils/errors';

class TaigaApiService {
  private client: HttpClient;
  private projectsCache: Map<number, { data: any[]; timestamp: number }> = new Map();
  private milestonesCache: Map<number, { data: any[]; timestamp: number }> = new Map();
  private userStoriesCache: Map<string, { data: any[]; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = new HttpClient(ENV.TAIGA_BASE_URL);
    this.loadCacheFromStorage();
  }

  private async loadCacheFromStorage() {
    try {
      const [projects, milestones, userStories] = await Promise.all([
        AsyncStorage.getItem('taiga_projects_cache'),
        AsyncStorage.getItem('taiga_milestones_cache'),
        AsyncStorage.getItem('taiga_userstories_cache'),
      ]);
      if (projects) this.projectsCache = new Map(JSON.parse(projects));
      if (milestones) this.milestonesCache = new Map(JSON.parse(milestones));
      if (userStories) this.userStoriesCache = new Map(JSON.parse(userStories));
    } catch {}
  }

  private async saveCacheToStorage() {
    try {
      await Promise.all([
        AsyncStorage.setItem('taiga_projects_cache', JSON.stringify([...this.projectsCache])),
        AsyncStorage.setItem('taiga_milestones_cache', JSON.stringify([...this.milestonesCache])),
        AsyncStorage.setItem('taiga_userstories_cache', JSON.stringify([...this.userStoriesCache])),
      ]);
    } catch {}
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  async clearCache() {
    this.projectsCache.clear();
    this.milestonesCache.clear();
    this.userStoriesCache.clear();
    await AsyncStorage.multiRemove(['taiga_projects_cache', 'taiga_milestones_cache', 'taiga_userstories_cache']);
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

  async getProjects(userId: number, authToken: string, forceRefresh = false): Promise<any[]> {
    const cached = this.projectsCache.get(userId);
    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      console.log('📦 Cache hit: projects for user', userId);
      return cached.data;
    }

    console.log('🌐 Cache miss: fetching projects for user', userId);
    try {
      const data = await this.client.get<any[]>(
        `/api/v1/projects?member=${userId}`,
        { Authorization: `Bearer ${authToken}` }
      );
      this.projectsCache.set(userId, { data, timestamp: Date.now() });
      this.saveCacheToStorage();
      return data;
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 401) throw error;
      throw new AuthError('Failed to fetch projects.');
    }
  }

  async getMilestones(projectId: number, authToken: string, forceRefresh = false): Promise<any[]> {
    const cached = this.milestonesCache.get(projectId);
    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      console.log('📦 Cache hit: milestones for project', projectId);
      return cached.data;
    }

    console.log('🌐 Cache miss: fetching milestones for project', projectId);
    try {
      const data = await this.client.get<any[]>(
        `/api/v1/milestones?project=${projectId}`,
        { Authorization: `Bearer ${authToken}` }
      );
      this.milestonesCache.set(projectId, { data, timestamp: Date.now() });
      this.saveCacheToStorage();
      return data;
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 401) throw error;
      throw new AuthError('Failed to fetch milestones.');
    }
  }

  async getUserStories(
    projectId: number,
    authToken: string,
    milestoneId?: number,
    forceRefresh = false
  ): Promise<any[]> {
    const cacheKey = `${projectId}-${milestoneId || 'all'}`;
    const cached = this.userStoriesCache.get(cacheKey);
    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      console.log('📦 Cache hit: user stories for', cacheKey);
      return cached.data;
    }

    console.log('🌐 Cache miss: fetching user stories for', cacheKey);
    try {
      let url = `/api/v1/userstories?project=${projectId}`;
      if (milestoneId) {
        url += `&milestone=${milestoneId}`;
      }
      const data = await this.client.get<any[]>(url, {
        Authorization: `Bearer ${authToken}`,
      });
      this.userStoriesCache.set(cacheKey, { data, timestamp: Date.now() });
      this.saveCacheToStorage();
      return data;
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 401) throw error;
      throw new AuthError('Failed to fetch user stories.');
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
