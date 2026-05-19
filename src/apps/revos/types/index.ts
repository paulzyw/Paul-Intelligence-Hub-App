/**
 * RevOS Foundational Types
 * Defines the core models for the Revenue Operating System sandbox.
 */

export type RevOSRole = 
  | 'guest'
  | 'free_user'
  | 'paid_user'
  | 'enterprise_user'
  | 'workspace_admin'
  | 'enterprise_executive'
  | 'revos_admin'
  | 'super_admin';

export interface RevOSOrg {
  id: string;
  name: string;
  domain?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
}

export interface RevOSProfile {
  id: string;
  org_id: string | null;
  role: RevOSRole;
  is_active: boolean;
  api_usage_quota: number;
  created_at: string;
}

export interface RevOSModuleState {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  last_ai_insight?: string;
}

export interface RevOSState {
  profile: RevOSProfile | null;
  org: RevOSOrg | null;
  isLoading: boolean;
  error: string | null;
}
