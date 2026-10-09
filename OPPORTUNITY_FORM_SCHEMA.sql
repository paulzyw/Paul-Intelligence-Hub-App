-- ==============================================================================
-- RevOS Opportunity Qualification Module: Opportunity Form Schema
-- Purpose: Dedicated & isolated data storage for Opportunity Form parameters
--          in the Opportunity Qualification Module.
-- Standard: Post-May/October 30 Supabase Data API access (Explicit GRANTs & RLS)
-- ==============================================================================

-- 1. Table for Opportunity Form records
CREATE TABLE IF NOT EXISTS public.opportunity_form_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE UNIQUE,
  
  -- Core Parameters
  company_name TEXT NOT NULL,
  opportunity_name TEXT NOT NULL,
  opportunity_owner TEXT DEFAULT 'Senior Enterprise AE',
  opportunity_stage TEXT DEFAULT 'Emerging Opportunity',
  estimated_revenue TEXT DEFAULT '$0',
  pipeline_stage TEXT DEFAULT 'Qualification',
  expected_close_date DATE,
  
  -- Inherited from SQL Qualification Module
  industry TEXT,
  revenue_motion TEXT,
  
  -- Optional Notes & Status
  strategic_note TEXT,
  form_status TEXT DEFAULT 'Saved',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.opportunity_form_records ENABLE ROW LEVEL SECURITY;

-- 3. Explicit Data API Permissions (Required by Supabase Data API)
GRANT SELECT ON public.opportunity_form_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_form_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_form_records TO service_role;

-- 4. RLS Security Policies
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

-- 5. Index for Fast Opportunity Lookup
CREATE INDEX IF NOT EXISTS idx_opp_form_records_opp_id 
ON public.opportunity_form_records(opportunity_id);
