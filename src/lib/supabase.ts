import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yfonihlpdvelssfmzokp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  slug: string;
};

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
  featured: boolean;
  is_featured: boolean;
  created_at: string;
  categories?: Category; // For joined queries
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
