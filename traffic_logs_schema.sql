-- 1. Create traffic_logs table
CREATE TABLE IF NOT EXISTS traffic_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  page_path TEXT NOT NULL,
  referrer_url TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  is_unlock_event BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE traffic_logs ENABLE ROW LEVEL SECURITY;

-- Allow public to INSERT but not SELECT
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert to traffic_logs' AND tablename = 'traffic_logs') THEN
        CREATE POLICY "Allow public insert to traffic_logs" ON traffic_logs FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read traffic_logs' AND tablename = 'traffic_logs') THEN
        CREATE POLICY "Allow authenticated read traffic_logs" ON traffic_logs FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 2. Aggregation Function
CREATE OR REPLACE FUNCTION get_traffic_stats(time_horizon TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  start_time TIMESTAMPTZ;
  interval_val TEXT;
BEGIN
  -- Determine start time based on horizon
  CASE time_horizon
    WHEN '24h' THEN start_time := NOW() - INTERVAL '24 hours'; interval_val := 'hour';
    WHEN '7d' THEN start_time := NOW() - INTERVAL '7 days'; interval_val := 'day';
    WHEN '30d' THEN start_time := NOW() - INTERVAL '30 days'; interval_val := 'day';
    WHEN '12w' THEN start_time := NOW() - INTERVAL '12 weeks'; interval_val := 'week';
    WHEN '12m' THEN start_time := NOW() - INTERVAL '12 months'; interval_val := 'month';
    WHEN 'ytd' THEN start_time := DATE_TRUNC('year', NOW()); interval_val := 'month';
    ELSE start_time := NOW() - INTERVAL '30 days'; interval_val := 'day';
  END CASE;

  WITH time_series AS (
    SELECT 
      DATE_TRUNC(interval_val, created_at) as bucket,
      COUNT(*) as visits
    FROM traffic_logs
    WHERE created_at >= start_time
    GROUP BY 1
    ORDER BY 1 ASC
  ),
  geo_stats AS (
    SELECT city, country, COUNT(*) as visit_count
    FROM traffic_logs
    WHERE created_at >= start_time
    GROUP BY 1, 2
    ORDER BY 3 DESC
    LIMIT 10
  ),
  source_stats AS (
    SELECT 
      CASE 
        WHEN referrer_url ILIKE '%linkedin.com%' THEN 'LinkedIn'
        WHEN referrer_url IS NULL OR referrer_url = '' THEN 'Direct'
        WHEN referrer_url ILIKE '%google.com%' THEN 'Google'
        ELSE 'Other'
      END as source,
      COUNT(*) as count
    FROM traffic_logs
    WHERE created_at >= start_time
    GROUP BY 1
  ),
  unlock_stats AS (
    SELECT COUNT(*) as unlocks
    FROM traffic_logs
    WHERE created_at >= start_time AND is_unlock_event = true
  ),
  recent_feed AS (
    SELECT 
        created_at as time,
        city,
        country,
        CASE 
            WHEN referrer_url ILIKE '%linkedin.com%' THEN 'LinkedIn'
            WHEN referrer_url IS NULL OR referrer_url = '' THEN 'Direct'
            WHEN referrer_url ILIKE '%google.com%' THEN 'Google'
            ELSE 'Other'
        END as source,
        is_unlock_event as unlocked
    FROM traffic_logs
    ORDER BY created_at DESC
    LIMIT 20
  )
  SELECT json_build_object(
    'time_series', COALESCE((SELECT json_agg(time_series) FROM time_series), '[]'::json),
    'top_cities', COALESCE((SELECT json_agg(geo_stats) FROM geo_stats), '[]'::json),
    'sources', COALESCE((SELECT json_agg(source_stats) FROM source_stats), '[]'::json),
    'unlock_total', (SELECT unlocks FROM unlock_stats),
    'recent_feed', COALESCE((SELECT json_agg(recent_feed) FROM recent_feed), '[]'::json)
  ) INTO result;

  return result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
