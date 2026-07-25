-- MQL Qualification Module Schema

-- 1. MQL Campaigns
CREATE TABLE IF NOT EXISTS public.mql_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.revos_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT,
  target_market TEXT,
  icp_definition TEXT,
  revenue_motion TEXT,
  industry TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. MQL Leads
CREATE TABLE IF NOT EXISTS public.mql_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.revos_orgs(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.mql_campaigns(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  company_name TEXT,
  job_title TEXT,
  website TEXT,
  lead_industry TEXT,
  employee_size TEXT,
  location TEXT,
  annual_revenue TEXT,
  phone TEXT,
  department TEXT,
  lead_date TEXT,
  status TEXT DEFAULT 'New', -- New, Assessing, Qualified, Disqualified, Nurture
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. MQL Evidence Assessments (Raw data collected by user)
CREATE TABLE IF NOT EXISTS public.mql_evidence_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.mql_leads(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL,
  dimension TEXT NOT NULL, -- fit, intent, engagement, timing
  is_present BOOLEAN NOT NULL DEFAULT false,
  evidence_value TEXT, -- The actual data or context
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lead_id, evidence_id)
);

-- 4. MQL Qualification Results (Output from Gemini)
CREATE TABLE IF NOT EXISTS public.mql_qualification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.mql_leads(id) ON DELETE CASCADE UNIQUE,
  qualification_status TEXT NOT NULL,
  qualification_score NUMERIC NOT NULL,
  confidence_score NUMERIC NOT NULL,
  dimension_scores JSONB, -- { fit, intent, engagement, timing }
  supporting_evidence JSONB,
  negative_evidence JSONB,
  missing_evidence JSONB,
  reasoning JSONB,
  recommendations JSONB,
  next_best_actions JSONB,
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.mql_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mql_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mql_evidence_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mql_qualification_results ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Assuming org_id is used for isolation, simplified here for the agent environment)
-- In a real app we'd join on org_id with the user's profile. Here we allow authenticated users to access data.

CREATE POLICY "Allow authenticated access to mql_campaigns" ON public.mql_campaigns FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to mql_leads" ON public.mql_leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to mql_evidence_assessments" ON public.mql_evidence_assessments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to mql_qualification_results" ON public.mql_qualification_results FOR ALL TO authenticated USING (true);

-- Grant permissions to Data API (Supabase requirement post-May 2026)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_campaigns TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_leads TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_evidence_assessments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_evidence_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_evidence_assessments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_qualification_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_qualification_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_qualification_results TO service_role;
