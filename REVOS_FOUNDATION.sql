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
-- Role Enum Constraint: guest, free_user, paid_user, enterprise_user, workspace_admin, enterprise_executive, revos_admin, super_admin
CREATE TABLE IF NOT EXISTS public.revos_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.revos_orgs(id),
  role TEXT NOT NULL DEFAULT 'free_user' CHECK (role IN (
    'guest',
    'free_user',
    'paid_user',
    'enterprise_user',
    'workspace_admin',
    'enterprise_executive',
    'revos_admin',
    'super_admin'
  )),
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

-- 5. Helper function for non-recursive policy evaluations
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.revos_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execution permission on function (Post-May 2026 standard)
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;

-- 6. POLICIES DECLARATION

-- 6a. public.revos_profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.revos_profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.revos_profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.revos_profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.revos_profiles;
DROP POLICY IF EXISTS "Super admins can manage all revos profiles" ON public.revos_profiles;

CREATE POLICY "Allow users to read own profile" 
  ON public.revos_profiles FOR SELECT 
  TO authenticated 
  USING (id = auth.uid() OR public.is_super_admin() = true);

CREATE POLICY "Allow users to insert own profile" 
  ON public.revos_profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (id = auth.uid() OR public.is_super_admin() = true);

CREATE POLICY "Allow users to update own profile" 
  ON public.revos_profiles FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid() OR public.is_super_admin() = true)
  WITH CHECK (id = auth.uid() OR public.is_super_admin() = true);

CREATE POLICY "Allow super admins to delete profiles" 
  ON public.revos_profiles FOR DELETE 
  TO authenticated 
  USING (public.is_super_admin() = true);


-- 6b. public.revos_orgs Policies
DROP POLICY IF EXISTS "Users can view their own org" ON public.revos_orgs;
DROP POLICY IF EXISTS "Allow users to select their organization" ON public.revos_orgs;
DROP POLICY IF EXISTS "Allow authenticated users to create organization" ON public.revos_orgs;
DROP POLICY IF EXISTS "Allow members of organization to update details" ON public.revos_orgs;

CREATE POLICY "Allow users to select their organization" 
  ON public.revos_orgs FOR SELECT 
  TO authenticated 
  USING (
    id IN (SELECT org_id FROM public.revos_profiles WHERE id = auth.uid())
    OR public.is_super_admin() = true
  );

CREATE POLICY "Allow authenticated users to create organization" 
  ON public.revos_orgs FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow members of organization to update details" 
  ON public.revos_orgs FOR UPDATE 
  TO authenticated 
  USING (
    id IN (SELECT org_id FROM public.revos_profiles WHERE id = auth.uid())
    OR public.is_super_admin() = true
  );


-- 6c. public.revos_licenses Policies
DROP POLICY IF EXISTS "Allow users to select organization licenses" ON public.revos_licenses;
DROP POLICY IF EXISTS "Allow super admins to manage licenses" ON public.revos_licenses;

CREATE POLICY "Allow users to select organization licenses" 
  ON public.revos_licenses FOR SELECT 
  TO authenticated 
  USING (
    org_id IN (SELECT org_id FROM public.revos_profiles WHERE id = auth.uid())
    OR public.is_super_admin() = true
  );

CREATE POLICY "Allow super admins to manage licenses" 
  ON public.revos_licenses FOR ALL 
  TO authenticated 
  USING (public.is_super_admin() = true);


-- 6d. public.revos_gtmos_strategies Policies
DROP POLICY IF EXISTS "Users can view their org's strategies" ON public.revos_gtmos_strategies;
DROP POLICY IF EXISTS "Allow members to read organization strategies" ON public.revos_gtmos_strategies;
DROP POLICY IF EXISTS "Allow members to insert strategies" ON public.revos_gtmos_strategies;
DROP POLICY IF EXISTS "Allow members to update organization strategies" ON public.revos_gtmos_strategies;
DROP POLICY IF EXISTS "Allow members to delete organization strategies" ON public.revos_gtmos_strategies;

CREATE POLICY "Allow members to read organization strategies" 
  ON public.revos_gtmos_strategies FOR SELECT 
  TO authenticated 
  USING (
    creator_id = auth.uid()
    OR public.is_super_admin() = true
  );

CREATE POLICY "Allow members to insert strategies" 
  ON public.revos_gtmos_strategies FOR INSERT 
  TO authenticated 
  WITH CHECK (
    creator_id = auth.uid()
    OR public.is_super_admin() = true
  );

CREATE POLICY "Allow members to update organization strategies" 
  ON public.revos_gtmos_strategies FOR UPDATE 
  TO authenticated 
  USING (
    creator_id = auth.uid()
    OR public.is_super_admin() = true
  )
  WITH CHECK (
    creator_id = auth.uid()
    OR public.is_super_admin() = true
  );

CREATE POLICY "Allow members to delete organization strategies" 
  ON public.revos_gtmos_strategies FOR DELETE 
  TO authenticated 
  USING (
    creator_id = auth.uid()
    OR public.is_super_admin() = true
  );
