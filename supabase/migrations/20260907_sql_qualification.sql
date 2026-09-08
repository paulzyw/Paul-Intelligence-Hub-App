-- SQL Qualification Module Database Schema Migration
-- Standard: Post-May 2026 explicit grants and RLS

-- 1. Table: organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name TEXT,
  industry TEXT,
  revenue_motion TEXT,
  opportunity_name TEXT,
  description TEXT,
  source TEXT,
  mql_reference_id TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table: sql_assessments
CREATE TABLE IF NOT EXISTS public.sql_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  assessment_status TEXT,
  qualification_status TEXT,
  overall_score NUMERIC,
  confidence_score NUMERIC,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table: sql_evidence_records
CREATE TABLE IF NOT EXISTS public.sql_evidence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.sql_assessments(id) ON DELETE CASCADE,
  dimension_code TEXT,
  evidence_object_id TEXT,
  evidence_content TEXT,
  evidence_source TEXT,
  validation_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assessment_id, evidence_object_id)
);

-- 6. Table: sql_dimension_results
CREATE TABLE IF NOT EXISTS public.sql_dimension_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.sql_assessments(id) ON DELETE CASCADE,
  dimension_code TEXT,
  dimension_name TEXT,
  score NUMERIC,
  confidence NUMERIC,
  assessment_summary TEXT,
  strengths JSONB,
  weaknesses JSONB,
  risks JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table: sql_reasoning_sessions
CREATE TABLE IF NOT EXISTS public.sql_reasoning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.sql_assessments(id) ON DELETE CASCADE,
  model_name TEXT,
  prompt_version TEXT,
  input_context JSONB,
  output_response JSONB,
  execution_status TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Table: sql_recommendations
CREATE TABLE IF NOT EXISTS public.sql_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.sql_assessments(id) ON DELETE CASCADE,
  dimension_code TEXT,
  priority TEXT,
  recommendation TEXT,
  expected_impact TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table: knowledge_asset_versions
CREATE TABLE IF NOT EXISTS public.knowledge_asset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name TEXT,
  version TEXT,
  status TEXT,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Table: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT,
  object_type TEXT,
  object_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sql_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sql_evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sql_dimension_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sql_reasoning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sql_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_asset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Explicit GRANTS to anon, authenticated, and service_role (Post-May 2026 Data API standard)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sql_assessments TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sql_evidence_records TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sql_dimension_results TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sql_reasoning_sessions TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sql_recommendations TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_asset_versions TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO anon, authenticated, service_role;

-- RLS Policies
CREATE POLICY "Allow authenticated access to organizations" ON public.organizations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to users" ON public.users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to opportunities" ON public.opportunities FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to sql_assessments" ON public.sql_assessments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to sql_evidence_records" ON public.sql_evidence_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to sql_dimension_results" ON public.sql_dimension_results FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to sql_reasoning_sessions" ON public.sql_reasoning_sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to sql_recommendations" ON public.sql_recommendations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to knowledge_asset_versions" ON public.knowledge_asset_versions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true);

-- Allow anonymous access as well for demo purposes if RLS isn't authenticated yet
CREATE POLICY "Allow anon access to organizations" ON public.organizations FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to users" ON public.users FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to opportunities" ON public.opportunities FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to sql_assessments" ON public.sql_assessments FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to sql_evidence_records" ON public.sql_evidence_records FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to sql_dimension_results" ON public.sql_dimension_results FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to sql_reasoning_sessions" ON public.sql_reasoning_sessions FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to sql_recommendations" ON public.sql_recommendations FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to knowledge_asset_versions" ON public.knowledge_asset_versions FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access to audit_logs" ON public.audit_logs FOR ALL TO anon USING (true);
