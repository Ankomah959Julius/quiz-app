-- ==============================================================================
-- QUIZ APP - STAGE 3 MIGRATION: 4-ROLE SYSTEM & PRIVILEGE ENFORCEMENT
-- Migration: 20261022000001_four_role_system.sql
-- Supports: super_admin, admin, lecturer, student
-- ==============================================================================

-- 1. UPDATE ROLE CHECK CONSTRAINT ON PROFILES
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'lecturer', 'student'));

-- 2. UPDATED SECURITY HELPER FUNCTIONS (SECURITY DEFINER)

-- Check if user is Super Admin (Platform Owner)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user has Administrative privileges (Super Admin or Institutional Admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role IN ('super_admin', 'admin') FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is Institutional Admin strictly
CREATE OR REPLACE FUNCTION public.is_institutional_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is Lecturer
CREATE OR REPLACE FUNCTION public.is_lecturer()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role = 'lecturer' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is Staff (Super Admin, Admin, or Lecturer)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role IN ('super_admin', 'admin', 'lecturer') FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. UPDATED ROLE ESCALATION TRIGGER (Strict Super Admin vs Admin Boundaries)
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_role text;
BEGIN
  -- Only validate if the role column is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();

    -- Super Admin has global role modification authority
    IF v_caller_role = 'super_admin' THEN
      NULL; -- Allowed
    
    -- Institutional Admin can only manage Lecturer and Student accounts
    ELSIF v_caller_role = 'admin' THEN
      IF OLD.role = 'super_admin' OR NEW.role IN ('super_admin', 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admins cannot create, promote, or alter Admin/Super Admin roles.';
      END IF;
    
    -- All other users (students, lecturers, anonymous) are blocked
    ELSE
      RAISE EXCEPTION 'Unauthorized: You do not have permission to modify account roles.';
    END IF;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reattach trigger
DROP TRIGGER IF EXISTS check_profile_role_update ON public.profiles;
CREATE TRIGGER check_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- 4. ENSURE NEW REGISTRATIONS ALWAYS DEFAULT TO STUDENT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'student' -- Always force student. Never trust client signup metadata for elevated roles.
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reattach auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
