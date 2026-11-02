import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  envUrl && 
  envKey && 
  envKey !== 'placeholder-key' && 
  envKey.length > 20
);

const supabaseUrl = envUrl || 'https://yfonihlpdvelssfmzokp.supabase.co';
const supabaseAnonKey = envKey || 'placeholder-key';

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing. Using fallback/placeholder values. This may lead to "Failed to fetch" errors. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type ContentType = 'post' | 'insight';
export type ContentStatus = 'draft' | 'published' | 'archived';

export type Post = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  category_id: string;
  read_time: number;
  thumbnail_url: string;
  featured?: boolean;
  is_featured: boolean;
  content_type?: ContentType;
  status?: ContentStatus;
  published_at?: string;
  updated_at?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  target_keyword?: string;
  created_at: string;
  categories?: Category; // For joined queries
};

export type ContentItem = Post;

export type ContentPublishingStatus = 
  | 'requested'
  | 'building'
  | 'build_succeeded'
  | 'build_failed'
  | 'deploying'
  | 'deployment_succeeded'
  | 'deployment_failed';

export type ContentPublishingLog = {
  id: string;
  build_request_id: string;
  event_type: string;
  content_id?: string;
  status: ContentPublishingStatus;
  details?: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
};

export type ReportType = {
  id: string;
  name: string;
  icon_name: string;
};

export type ResearchReport = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  feature_image_url: string;
  report_html_path: string;
  highlight_metric: string;
  status: 'draft' | 'published';
  report_type_id: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  report_types?: ReportType;
};

export type AccessCode = {
  id: string;
  code: string;
  expires_at: string;
  created_at: string;
};
