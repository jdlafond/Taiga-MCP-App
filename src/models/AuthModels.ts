export interface TaigaLoginResponse {
  id: number;
  username: string;
  full_name: string;
  full_name_display: string;
  color: string;
  bio: string;
  lang: string;
  theme: string;
  timezone: string;
  is_active: boolean;
  photo: string | null;
  big_photo: string | null;
  gravatar_id: string;
  roles: string[];
  total_private_projects: number;
  total_public_projects: number;
  email: string;
  uuid: string;
  date_joined: string;
  read_new_terms: boolean;
  accepted_terms: boolean;
  max_private_projects: number;
  max_public_projects: number;
  verified_email: boolean;
  refresh: string;
  auth_token: string;
}

export interface StoredTokens {
  auth_token: string;
  refresh: string;
}

export interface TaigaProject {
  id: number;
  name: string;
  slug: string;
  milestones?: TaigaMilestone[];
}

export interface TaigaMilestone {
  id: number;
  name: string;
  slug: string;
  closed: boolean;
}

export interface TaigaUserStory {
  id: number;
  ref: number;
  subject: string;
  description?: string;
  milestone?: number;
}

export interface UserContext {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
  type?: string;
}
