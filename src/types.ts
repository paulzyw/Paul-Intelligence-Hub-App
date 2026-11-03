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

export interface BusinessChallenge {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  article_count?: number;
}

export interface ContentBusinessChallenge {
  id: string;
  content_id: string;
  challenge_id: string;
  is_primary: boolean;
  created_at: string;
  business_challenges?: BusinessChallenge;
}

export interface SelectedBusinessChallenge {
  challengeId: string;
  isPrimary: boolean;
  challenge?: BusinessChallenge;
}

export interface ArticleWithChallengeMeta {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  read_time: number;
  thumbnail_url: string;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
  isPrimary: boolean;
  content_type?: string;
  author_id?: string;
  author?: string;
}

export interface ChallengeWithArticles {
  challenge: BusinessChallenge;
  articles: ArticleWithChallengeMeta[];
}

