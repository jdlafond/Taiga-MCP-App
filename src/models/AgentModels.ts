import { UserContext } from './AuthModels';

export interface AgentRequest {
  project_ref: string;
  sprint_ref: string;
  prompt: string;
  auth_token: string;
  refresh: string;
  user_context: UserContext;
  /** When set, tasks are added to this user story instead of creating new ones. */
  user_story_id?: number;
}

export interface CreatedArtifact {
  type: string;
  id: number;
  ref: number;
  subject: string;
}

export interface AgentResponse {
  summary: string;
  created_artifacts?: CreatedArtifact[];
  warnings?: string[];
  errors?: string[];
}
