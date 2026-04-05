-- Create the posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  read_time INTEGER NOT NULL,
  thumbnail_url TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access" ON posts
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON posts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON posts FOR DELETE USING (auth.role() = 'authenticated');

-- Create a storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'blog-images' );
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'blog-images' AND auth.role() = 'authenticated' );
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'blog-images' AND auth.role() = 'authenticated' );
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'blog-images' AND auth.role() = 'authenticated' );

-- Insert Initial Data
INSERT INTO posts (title, slug, summary, content, category, read_time, thumbnail_url, featured) VALUES
(
  'Innovation Leadership: P&L Leaders Drive Growth',
  'innovation-leadership-pl-leaders-drive-growth',
  'A strategic look at how P&L leaders can foster innovation and drive sustainable growth in complex industrial environments.',
  'Content will be provided later.',
  'Leadership',
  5,
  'https://picsum.photos/seed/innovation/1200/600',
  true
),
(
  'The Power of a Structured 5RQ Pipeline Governance Model in a SaaS Business',
  'structured-5rq-pipeline-governance-saas',
  'Discover how the 5RQ pipeline governance model can transform your SaaS business by ensuring predictable revenue and scalable growth.',
  'Content will be provided later.',
  'Revenue Growth',
  8,
  'https://picsum.photos/seed/pipeline/1200/600',
  false
),
(
  'The Entrepreneurial Edge',
  'the-entrepreneurial-edge',
  'Exploring the mindset and strategies required to maintain an entrepreneurial edge within large, established organizations.',
  'Content will be provided later.',
  'AI Strategy',
  6,
  'https://picsum.photos/seed/edge/1200/600',
  false
);
