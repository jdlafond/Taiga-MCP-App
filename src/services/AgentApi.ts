import { ENV } from '../config/env';
import { AgentRequest, AgentResponse } from '../models/AgentModels';
import { HttpClient } from './HttpClient';

class AgentApiService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient(ENV.AGENT_BASE_URL);
  }

  async runAgent(request: AgentRequest): Promise<AgentResponse> {
    return this.client.post<AgentResponse>('/agent/run', request);
  }
}

export const AgentApi = new AgentApiService();
