-- ==============================================================================
-- RevOS Opportunity Qualification Module: Opportunity Form Schema Migration
-- Standard: Post-May/October 30 Supabase Data API explicit grants and RLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.opportunity_form_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  opportunity_name TEXT NOT NULL,
  opportunity_owner TEXT DEFAULT 'Senior Enterprise AE',
  opportunity_stage TEXT DEFAULT 'Emerging Opportunity',
  estimated_revenue TEXT DEFAULT '$0',
  pipeline_stage TEXT DEFAULT 'Qualification',
  expected_close_date DATE,
  industry TEXT,
  revenue_motion TEXT,
  strategic_note TEXT,
  form_status TEXT DEFAULT 'Saved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.opportunity_form_records ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.opportunity_form_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_form_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_form_records TO service_role;

CREATE POLICY "Allow authenticated read/write on opportunity_form_records" 
ON public.opportunity_form_records 
FOR ALL 
TO authenticated 
USING (true);

CREATE POLICY "Allow anonymous read/write on opportunity_form_records" 
ON public.opportunity_form_records 
FOR ALL 
TO anon 
USING (true);

CREATE INDEX IF NOT EXISTS idx_opp_form_records_opp_id 
ON public.opportunity_form_records(opportunity_id);
