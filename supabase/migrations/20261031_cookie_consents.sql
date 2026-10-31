-- =========================================================================
-- REVOS COOKIE CONSENT MANAGEMENT SCHEMA
-- Migration: 20261031_cookie_consents.sql
-- Description: Creates the cookie_consents table for compliance audit logging,
--              enforces Row Level Security (RLS), and grants Post-May 2026 Supabase
--              Data API permissions for anon, authenticated, and service_role.
-- =========================================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.cookie_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    anonymous_id TEXT,
    consent_version TEXT NOT NULL DEFAULT '1.0',
    necessary BOOLEAN NOT NULL DEFAULT true,
    functional BOOLEAN NOT NULL DEFAULT false,
    analytics BOOLEAN NOT NULL DEFAULT false,
    marketing BOOLEAN NOT NULL DEFAULT false,
    consent_status TEXT NOT NULL CHECK (consent_status IN ('pending', 'accepted_all', 'rejected_non_essential', 'custom')),
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient user queries and anonymous session lookups
CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_id ON public.cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_anonymous_id ON public.cookie_consents(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_timestamp ON public.cookie_consents(consent_timestamp DESC);

-- 2. Permissions for Supabase Data API Access (Strict Post-May 2026 Policy Compliance)
GRANT SELECT, INSERT ON public.cookie_consents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cookie_consents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cookie_consents TO service_role;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Policy 1: Anonymous visitors can record their own anonymous consent decisions
DROP POLICY IF EXISTS "Anonymous visitors can log consent" ON public.cookie_consents;
CREATE POLICY "Anonymous visitors can log consent" 
ON public.cookie_consents 
FOR INSERT 
TO anon 
WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

-- Policy 2: Authenticated users can insert their own consent decisions
DROP POLICY IF EXISTS "Users can log their own consent" ON public.cookie_consents;
CREATE POLICY "Users can log their own consent" 
ON public.cookie_consents 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy 3: Authenticated users can read only their own consent history
DROP POLICY IF EXISTS "Users can view their own consent records" ON public.cookie_consents;
CREATE POLICY "Users can view their own consent records" 
ON public.cookie_consents 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy 4: Platform administrators (Super Admin and RevOS Admin) can audit compliance records
DROP POLICY IF EXISTS "Admins can view consent audit records" ON public.cookie_consents;
CREATE POLICY "Admins can view consent audit records" 
ON public.cookie_consents 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('super_admin', 'revos_admin')
    )
);
