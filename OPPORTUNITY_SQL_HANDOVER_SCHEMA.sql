-- ==============================================================================
-- RevOS Opportunity Qualification Module: SQL Handover Intelligence Schema
-- Purpose: Dedicated & isolated data storage for SQL Qualification Intelligence
--          Packages (SQL-QIP) inherited by the Opportunity Qualification Module.
-- Compatibility: Post-May/October 30 Supabase Data API standard (Explicit GRANTs & RLS)
-- ==============================================================================

-- 1. Dedicated Table for SQL-to-Opportunity Handover Intelligence
CREATE TABLE IF NOT EXISTS public.opportunity_sql_handover_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE UNIQUE,
  session_id UUID REFERENCES public.opportunity_qualification_sessions(id) ON DELETE SET NULL,
  
  -- SQL Qualification Intelligence Package (SQL-QIP) Canonical Structure
  sql_qip_package JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Classified Data Components (Categories A, B, C, D)
  customer_context JSONB DEFAULT '{}'::jsonb,
  revenue_motion_context JSONB DEFAULT '{}'::jsonb,
  business_context JSONB DEFAULT '{}'::jsonb,
  business_value_context JSONB DEFAULT '{}'::jsonb,
  solution_context JSONB DEFAULT '{}'::jsonb,
  stakeholder_context JSONB DEFAULT '{}'::jsonb,
  engagement_context JSONB DEFAULT '{}'::jsonb,
  dimension_results JSONB DEFAULT '{}'::jsonb,
  qualification_evidence JSONB DEFAULT '{}'::jsonb,
  qualification_risks JSONB DEFAULT '{}'::jsonb,
  qualification_recommendations JSONB DEFAULT '{}'::jsonb,
  
  -- User Overrides / Synchronized RevOps Parameters
  editable_fields JSONB DEFAULT '{}'::jsonb,
  handover_status TEXT DEFAULT 'Inherited',
  
  -- Metadata & Timestamps
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.opportunity_sql_handover_details ENABLE ROW LEVEL SECURITY;

-- 3. Explicit Data API Permissions (Required by Supabase Data API)
GRANT SELECT ON public.opportunity_sql_handover_details TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_sql_handover_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_sql_handover_details TO service_role;

-- 4. RLS Security Policies
CREATE POLICY "Allow authenticated read/write on opportunity_sql_handover_details" 
ON public.opportunity_sql_handover_details 
FOR ALL 
TO authenticated 
USING (true);

CREATE POLICY "Allow anonymous read/write on opportunity_sql_handover_details" 
ON public.opportunity_sql_handover_details 
FOR ALL 
TO anon 
USING (true);

-- 5. Helpful Index for Fast Opportunity Lookup
CREATE INDEX IF NOT EXISTS idx_opp_sql_handover_opp_id 
ON public.opportunity_sql_handover_details(opportunity_id);
