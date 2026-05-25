-- Create User Role Enum
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM (
        'guest',
        'free_user',
        'paid_user',
        'enterprise_user',
        'workspace_admin',
        'enterprise_executive',
        'revos_admin',
        'super_admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role public.user_role NOT NULL DEFAULT 'free_user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Permissions for Data API Access (Post-May 2026 Policy)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- RLS Rules
-- 1. Everyone can view public profile info (email/role confirmation)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- 2. Users can update their own non-role profiles (future extensibility)
CREATE POLICY "Users can edit own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Super admins can manage all profiles
CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (public.is_super_admin() = true)
WITH CHECK (public.is_super_admin() = true);

-- Trigger: Automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        new.id, 
        new.email, 
        -- Fallback: default to free_user for platform signups
        COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'free_user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin' 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;
