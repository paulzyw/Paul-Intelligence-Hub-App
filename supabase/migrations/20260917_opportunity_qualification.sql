-- Opportunity Qualification Module Database Schema Migration
-- Standard: Post-May 2026 explicit grants and RLS

-- 1. Table: opportunity_qualification_sessions
CREATE TABLE IF NOT EXISTS public.opportunity_qualification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  revenue_motion TEXT,
  industry TEXT,
  sql_inheritance_data JSONB,
  overall_score NUMERIC,
  confidence_score NUMERIC,
  qualification_status TEXT,
  is_promoted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: opportunity_qualification_evidence
CREATE TABLE IF NOT EXISTS public.opportunity_qualification_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.opportunity_qualification_sessions(id) ON DELETE CASCADE,
  dimension_code TEXT,
  evidence_id TEXT,
  question_text TEXT,
  answer_value TEXT,
  evidence_source TEXT,
  evidence_strength TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, evidence_id)
);

-- 3. Table: opportunity_qualification_results
CREATE TABLE IF NOT EXISTS public.opportunity_qualification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.opportunity_qualification_sessions(id) ON DELETE CASCADE,
  qualification_status TEXT,
  overall_score NUMERIC,
  confidence_score NUMERIC,
  dimension_results JSONB,
  qualification_explanation TEXT,
  risks JSONB,
  contradictions JSONB,
  recommended_actions JSONB,
  next_best_questions JSONB,
  final_decision JSONB,
  configuration_versions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id)
);

-- Enable RLS for all tables
ALTER TABLE public.opportunity_qualification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_qualification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_qualification_results ENABLE ROW LEVEL SECURITY;

-- Explicit GRANTS to anon, authenticated, and service_role (Post-May 2026 Data API standard)
GRANT SELECT ON public.opportunity_qualification_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_qualification_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_qualification_sessions TO service_role;

GRANT SELECT ON public.opportunity_qualification_evidence TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_qualification_evidence TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_qualification_evidence TO service_role;

GRANT SELECT ON public.opportunity_qualification_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_qualification_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_qualification_results TO service_role;

-- RLS Policies
CREATE POLICY "Allow authenticated access to sessions" ON public.opportunity_qualification_sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to evidence" ON public.opportunity_qualification_evidence FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to results" ON public.opportunity_qualification_results FOR ALL TO authenticated USING (true);

-- Allow anonymous access as well for demo/preview purposes if auth is omitted
CREATE POLICY "Allow anon access to sessions" ON public.opportunity_qualification_sessions FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to evidence" ON public.opportunity_qualification_evidence FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to results" ON public.opportunity_qualification_results FOR ALL TO anon USING (true);
