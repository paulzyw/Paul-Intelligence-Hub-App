-- Migration: 20261009_opportunity_promotion_and_history.sql
-- Description: Creates dedicated tables for Opportunity Promotions and Qualification History in Supabase
-- Standards: Supabase Data API Access (Post-May 2026 explicit GRANTs and Row Level Security)
-- Note: Uses DROP POLICY IF EXISTS before CREATE POLICY so it is idempotent and safe to re-run.

-- ==============================================================================
-- 1. Table: public.opportunity_promotions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.opportunity_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.opportunity_qualification_sessions(id) ON DELETE SET NULL,
  promotion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  promotion_status TEXT NOT NULL DEFAULT 'Promoted to Opportunity',
  promoted_by TEXT DEFAULT 'Sales Representative',
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_opportunity_promotion UNIQUE(opportunity_id)
);

-- Grant access for Data API
GRANT SELECT ON public.opportunity_promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_promotions TO service_role;

-- Enable RLS
ALTER TABLE public.opportunity_promotions ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies for opportunity_promotions
DROP POLICY IF EXISTS "Allow public read on opportunity_promotions" ON public.opportunity_promotions;
CREATE POLICY "Allow public read on opportunity_promotions" 
  ON public.opportunity_promotions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow public insert and update on opportunity_promotions" ON public.opportunity_promotions;
CREATE POLICY "Allow public insert and update on opportunity_promotions" 
  ON public.opportunity_promotions FOR ALL TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated access to opportunity_promotions" ON public.opportunity_promotions;
CREATE POLICY "Allow authenticated access to opportunity_promotions" 
  ON public.opportunity_promotions FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access to opportunity_promotions" ON public.opportunity_promotions;
CREATE POLICY "Allow service_role full access to opportunity_promotions" 
  ON public.opportunity_promotions FOR ALL TO service_role USING (true);


-- ==============================================================================
-- 2. Table: public.opportunity_qualification_history
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.opportunity_qualification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.opportunity_qualification_sessions(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  qualification_status TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  evidence_changes TEXT,
  reasoning_version TEXT DEFAULT 'Gemini 3.1 Flash Lite - v3.0',
  rules_version TEXT DEFAULT 'OQ Rules v3.0',
  user_name TEXT DEFAULT 'Sales Representative',
  raw_result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant access for Data API
GRANT SELECT ON public.opportunity_qualification_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_qualification_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_qualification_history TO service_role;

-- Enable RLS
ALTER TABLE public.opportunity_qualification_history ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies for opportunity_qualification_history
DROP POLICY IF EXISTS "Allow public read on opportunity_qualification_history" ON public.opportunity_qualification_history;
CREATE POLICY "Allow public read on opportunity_qualification_history" 
  ON public.opportunity_qualification_history FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow public insert on opportunity_qualification_history" ON public.opportunity_qualification_history;
CREATE POLICY "Allow public insert on opportunity_qualification_history" 
  ON public.opportunity_qualification_history FOR ALL TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated access to opportunity_qualification_history" ON public.opportunity_qualification_history;
CREATE POLICY "Allow authenticated access to opportunity_qualification_history" 
  ON public.opportunity_qualification_history FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access to opportunity_qualification_history" ON public.opportunity_qualification_history;
CREATE POLICY "Allow service_role full access to opportunity_qualification_history" 
  ON public.opportunity_qualification_history FOR ALL TO service_role USING (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_opportunity_promotions_opp_id ON public.opportunity_promotions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_history_opp_id ON public.opportunity_qualification_history(opportunity_id);
