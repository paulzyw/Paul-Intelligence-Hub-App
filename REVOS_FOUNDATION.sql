-- RevOS Foundational Schema
-- This script sets up the core RBAC and organizational hierarchy for the Revenue Operating System.

-- 1. Organizations (Enterprise Layer)
CREATE TABLE IF NOT EXISTS public.revos_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Profiles & RBAC
-- Role Enum: Guest, Free User, Paid User, Enterprise User, Workspace Admin, Enterprise Executive, RevOS Admin, Super Admin
CREATE TABLE IF NOT EXISTS public.revos_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.revos_orgs(id),
  role TEXT NOT NULL DEFAULT 'free_user',
  is_active BOOLEAN DEFAULT TRUE,
  api_usage_quota INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Licenses & Entitlements (Monetization Layer)
CREATE TABLE IF NOT EXISTS public.revos_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.revos_orgs(id),
  license_type TEXT NOT NULL, -- 'prepaid_usage', 'enterprise_annual'
  currency TEXT DEFAULT 'USD', -- 'USD' or 'CNY'
  balance DECIMAL(12,2) DEFAULT 0.00,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active'
);

-- 4. GTMOS Strategic Inputs (Layer 1)
CREATE TABLE IF NOT EXISTS public.revos_gtmos_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.revos_orgs(id),
  creator_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  market_segment TEXT,
  strategic_objective TEXT,
  raw_input JSONB, -- Fragmented data for Layer 2 structuring
  structured_intelligence JSONB, -- Layer 2 output (AI normalized)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SECURITY: Enable Row Level Security
ALTER TABLE public.revos_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revos_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revos_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revos_gtmos_strategies ENABLE ROW LEVEL SECURITY;

-- DATA API ACCESS: Mandatory Grants (Post-May 2026 Policy)
GRANT SELECT ON public.revos_orgs TO anon, authenticated, service_role;
GRANT ALL ON public.revos_orgs TO authenticated, service_role;

GRANT SELECT ON public.revos_profiles TO anon, authenticated, service_role;
GRANT ALL ON public.revos_profiles TO authenticated, service_role;

GRANT SELECT ON public.revos_licenses TO anon, authenticated, service_role;
GRANT ALL ON public.revos_licenses TO authenticated, service_role;

GRANT SELECT ON public.revos_gtmos_strategies TO anon, authenticated, service_role;
GRANT ALL ON public.revos_gtmos_strategies TO authenticated, service_role;

-- POLICIES (Preliminary)
CREATE POLICY "Users can view their own org" 
  ON public.revos_orgs FOR SELECT 
  TO authenticated 
  USING (id IN (SELECT org_id FROM public.revos_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own profile" 
  ON public.revos_profiles FOR SELECT 
  TO authenticated 
  USING (id = auth.uid());

CREATE POLICY "Users can view their org's strategies" 
  ON public.revos_gtmos_strategies FOR SELECT 
  TO authenticated 
  USING (org_id IN (SELECT org_id FROM public.revos_profiles WHERE id = auth.uid()));
