-- Create the posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  read_time INTEGER NOT NULL,
  thumbnail_url TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  category_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Report Types table
CREATE TABLE IF NOT EXISTS report_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Research Reports table
CREATE TABLE IF NOT EXISTS research_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  feature_image_url TEXT,
  report_html_path TEXT NOT NULL,
  highlight_metric TEXT,
  status TEXT DEFAULT 'published',
  report_type_id UUID REFERENCES report_types(id),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;

-- Grant access for Data API
GRANT SELECT ON public.categories TO anon, authenticated, service_role;
GRANT ALL ON public.categories TO authenticated, service_role;

GRANT SELECT ON public.report_types TO anon, authenticated, service_role;
GRANT ALL ON public.report_types TO authenticated, service_role;

GRANT SELECT ON public.research_reports TO anon, authenticated, service_role;
GRANT ALL ON public.research_reports TO authenticated, service_role;

-- Public Read Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read' AND tablename = 'categories') THEN
        CREATE POLICY "Allow public read" ON categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read' AND tablename = 'report_types') THEN
        CREATE POLICY "Allow public read" ON report_types FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read' AND tablename = 'research_reports') THEN
        CREATE POLICY "Allow public read" ON research_reports FOR SELECT USING (true);
    END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Grant access for Data API
GRANT SELECT ON public.posts TO anon, authenticated, service_role;
GRANT ALL ON public.posts TO authenticated, service_role;

-- Policy: Allow public read access
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'posts') THEN
        CREATE POLICY "Allow public read access" ON posts FOR SELECT USING (true);
    END IF;
END $$;

-- Policies for authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated insert' AND tablename = 'posts') THEN
        CREATE POLICY "Allow authenticated insert" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated update' AND tablename = 'posts') THEN
        CREATE POLICY "Allow authenticated update" ON posts FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated delete' AND tablename = 'posts') THEN
        CREATE POLICY "Allow authenticated delete" ON posts FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('knowledge-base', 'knowledge-base', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DO $$ 
BEGIN
    -- blog-images policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'blog-images' );
    END IF;
    -- knowledge-base policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access KB' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access KB" ON storage.objects FOR SELECT USING ( bucket_id = 'knowledge-base' );
    END IF;
END $$;

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Grant access for Data API
GRANT SELECT, INSERT ON public.chat_history TO anon, authenticated, service_role;
GRANT ALL ON public.chat_history TO authenticated, service_role;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert' AND tablename = 'chat_history') THEN
        CREATE POLICY "Allow public insert" ON chat_history FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select' AND tablename = 'chat_history') THEN
        CREATE POLICY "Allow public select" ON chat_history FOR SELECT USING (true);
    END IF;
END $$;

-- Create temp_access_codes table
CREATE TABLE IF NOT EXISTS temp_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE temp_access_codes ENABLE ROW LEVEL SECURITY;

-- Grant access for Data API
GRANT SELECT ON public.temp_access_codes TO anon, authenticated, service_role;
GRANT ALL ON public.temp_access_codes TO authenticated, service_role;

-- Policies for temp_access_codes
DO $$ 
BEGIN
    -- Allow public to select if code is valid and not expired
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read of valid codes' AND tablename = 'temp_access_codes') THEN
        CREATE POLICY "Allow public read of valid codes" ON temp_access_codes FOR SELECT USING (expires_at > NOW());
    END IF;
    -- Allow authenticated to manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated manage' AND tablename = 'temp_access_codes') THEN
        CREATE POLICY "Allow authenticated manage" ON temp_access_codes FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create site_settings table to persist hero background and animation parameters
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  hero_background TEXT NOT NULL DEFAULT 'galaxy',
  meteor_density NUMERIC NOT NULL DEFAULT 6.0,
  meteor_speed NUMERIC NOT NULL DEFAULT 0.5,
  galaxy_star_speed NUMERIC NOT NULL DEFAULT 0.95,
  galaxy_density NUMERIC NOT NULL DEFAULT 0.9,
  galaxy_glow_intensity NUMERIC NOT NULL DEFAULT 0.15,
  galaxy_saturation NUMERIC NOT NULL DEFAULT 0.0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the default configuration row if it doesn't exist
INSERT INTO public.site_settings (
  id, 
  hero_background, 
  meteor_density, 
  meteor_speed, 
  galaxy_star_speed, 
  galaxy_density, 
  galaxy_glow_intensity, 
  galaxy_saturation
)
VALUES (
  'default', 
  'galaxy', 
  6.0, 
  0.5, 
  0.95, 
  0.9, 
  0.15, 
  0.0
)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Grant access for Data API
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO service_role;

-- Policies for site_settings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'site_settings') THEN
        CREATE POLICY "Allow public read access" ON public.site_settings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated update' AND tablename = 'site_settings') THEN
        CREATE POLICY "Allow authenticated update" ON public.site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated insert' AND tablename = 'site_settings') THEN
        CREATE POLICY "Allow authenticated insert" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
END $$;

