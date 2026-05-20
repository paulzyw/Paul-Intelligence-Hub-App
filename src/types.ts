export type UserRole = 
  | 'guest'
  | 'free_user'
  | 'paid_user'
  | 'enterprise_user'
  | 'workspace_admin'
  | 'enterprise_executive'
  | 'revos_admin'
  | 'super_admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}
