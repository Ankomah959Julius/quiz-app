-- ==============================================================================
-- QUIZ APP - COMPLETE ALL-IN-ONE DATABASE SETUP & SEED SCRIPT
-- Run this script in the Supabase Dashboard SQL Editor (Project: quiz-app)
-- It creates all tables, RLS policies, scoring procedures, and 4 default accounts.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS FOR ROLE-BASED ACCESS CONTROL (SECURITY DEFINER)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role IN ('super_admin', 'admin') FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_institutional_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_lecturer()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role = 'lecturer' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role IN ('super_admin', 'admin', 'lecturer') FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. PROFILES TABLE & ROLE ESCALATION DEFENSE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('super_admin', 'admin', 'lecturer', 'student')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Automatic profile creation on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger strictly preventing non-admins from altering their role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_role text;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();

    IF v_caller_role = 'super_admin' THEN
      NULL; -- Allowed
    ELSIF v_caller_role = 'admin' THEN
      IF OLD.role = 'super_admin' OR NEW.role IN ('super_admin', 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admins cannot create, promote, or alter Admin/Super Admin roles.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Unauthorized: Only authorized administrators can alter user roles.';
    END IF;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_profile_role_update ON public.profiles;
CREATE TRIGGER check_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ------------------------------------------------------------------------------
-- 4. COURSES & COURSE MEMBERS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_created_by ON public.courses(created_by);

CREATE TABLE IF NOT EXISTS public.course_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_role text NOT NULL DEFAULT 'lecturer' CHECK (membership_role IN ('lecturer', 'student', 'assistant')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

CREATE OR REPLACE FUNCTION public.can_manage_course(p_course_id uuid)
RETURNS boolean AS $$
BEGIN
  IF public.is_admin() THEN RETURN true; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = p_course_id AND c.created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.course_members cm
    WHERE cm.course_id = p_course_id AND cm.user_id = auth.uid() AND cm.membership_role IN ('lecturer', 'assistant')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 5. PDF IMPORTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pdf_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  status text NOT NULL DEFAULT 'uploaded' 
    CHECK (status IN ('uploaded', 'processing', 'needs_review', 'ready_to_publish', 'published', 'failed')),
  error_message text,
  extracted_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- ------------------------------------------------------------------------------
-- 6. QUIZZES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  duration_minutes integer DEFAULT 30 CHECK (duration_minutes > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  max_attempts integer DEFAULT 1 CHECK (max_attempts > 0),
  passing_score numeric(5,2) DEFAULT 50.0,
  allow_review boolean DEFAULT true,
  shuffle_questions boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_quiz_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE OR REPLACE FUNCTION public.can_manage_quiz(p_quiz_id uuid)
RETURNS boolean AS $$
BEGIN
  IF public.is_admin() THEN RETURN true; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = p_quiz_id AND (q.created_by = auth.uid() OR public.can_manage_course(q.course_id))
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 7. QUESTIONS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  pdf_import_id uuid REFERENCES public.pdf_imports(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice' 
    CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  marks numeric(5,2) NOT NULL DEFAULT 1.0 CHECK (marks >= 0),
  position integer NOT NULL DEFAULT 1,
  verification_status text NOT NULL DEFAULT 'unverified' 
    CHECK (verification_status IN ('unverified', 'verified', 'flagged')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.can_manage_question(p_question_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.questions q
    WHERE q.id = p_question_id AND public.can_manage_quiz(q.quiz_id)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 8. ANSWER OPTIONS & ANSWER PROTECTION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.answer_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_label text NOT NULL,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE VIEW public.quiz_options_student_safe AS
SELECT
  ao.id,
  ao.question_id,
  ao.option_label,
  ao.option_text,
  ao.position,
  CASE
    WHEN public.is_admin() OR public.can_manage_question(ao.question_id) THEN ao.is_correct
    ELSE NULL
  END AS is_correct
FROM public.answer_options ao;

-- ------------------------------------------------------------------------------
-- 9. QUIZ ATTEMPTS & SCORE PROTECTION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
  status text NOT NULL DEFAULT 'in_progress' 
    CHECK (status IN ('in_progress', 'submitted', 'abandoned', 'timed_out')),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  score numeric(6,2),
  total_marks numeric(6,2),
  percentage numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, student_id, attempt_number)
);

CREATE OR REPLACE FUNCTION public.prevent_student_score_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_staff() THEN
    IF NEW.score IS DISTINCT FROM OLD.score OR 
       NEW.total_marks IS DISTINCT FROM OLD.total_marks OR 
       NEW.percentage IS DISTINCT FROM OLD.percentage THEN
      RAISE EXCEPTION 'Unauthorized: Students cannot modify score or percentage values.';
    END IF;
    IF NEW.student_id IS DISTINCT FROM OLD.student_id OR NEW.quiz_id IS DISTINCT FROM OLD.quiz_id THEN
      RAISE EXCEPTION 'Unauthorized: Cannot alter attempt student or quiz ownership.';
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_attempt_score_update ON public.quiz_attempts;
CREATE TRIGGER check_attempt_score_update
  BEFORE UPDATE ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.prevent_student_score_tampering();

-- ------------------------------------------------------------------------------
-- 10. ATTEMPT ANSWERS & TAMPERING PREVENTION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id uuid REFERENCES public.answer_options(id) ON DELETE SET NULL,
  answer_text text,
  is_correct boolean,
  marks_awarded numeric(5,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

CREATE OR REPLACE FUNCTION public.prevent_attempt_answer_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_staff() THEN
    IF NEW.is_correct IS DISTINCT FROM OLD.is_correct OR 
       NEW.marks_awarded IS DISTINCT FROM OLD.marks_awarded THEN
      RAISE EXCEPTION 'Unauthorized: Marks and answer correctness are computed server-side.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_attempt_answer_update ON public.attempt_answers;
CREATE TRIGGER check_attempt_answer_update
  BEFORE UPDATE ON public.attempt_answers
  FOR EACH ROW EXECUTE FUNCTION public.prevent_attempt_answer_tampering();

-- ------------------------------------------------------------------------------
-- 11. SECURE SERVER-SIDE SUBMISSION & SCORING STORED PROCEDURE
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_attempt_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_attempt record;
  v_total_marks numeric(6,2) := 0;
  v_earned_marks numeric(6,2) := 0;
  v_percentage numeric(5,2) := 0;
BEGIN
  SELECT * INTO v_attempt FROM public.quiz_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found.'; END IF;
  IF v_attempt.student_id != auth.uid() AND NOT public.is_staff() THEN RAISE EXCEPTION 'Unauthorized attempt submission.'; END IF;
  IF v_attempt.status = 'submitted' THEN RAISE EXCEPTION 'This attempt has already been submitted.'; END IF;

  UPDATE public.attempt_answers aa
  SET 
    is_correct = COALESCE(ao.is_correct, false),
    marks_awarded = CASE WHEN ao.is_correct THEN q.marks ELSE 0 END
  FROM public.questions q
  LEFT JOIN public.answer_options ao ON ao.id = aa.selected_option_id
  WHERE aa.attempt_id = p_attempt_id AND aa.question_id = q.id;

  SELECT COALESCE(SUM(marks), 0) INTO v_total_marks FROM public.questions WHERE quiz_id = v_attempt.quiz_id;
  SELECT COALESCE(SUM(marks_awarded), 0) INTO v_earned_marks FROM public.attempt_answers WHERE attempt_id = p_attempt_id;

  IF v_total_marks > 0 THEN
    v_percentage := ROUND((v_earned_marks / v_total_marks) * 100.0, 2);
  ELSE
    v_percentage := 0.0;
  END IF;

  UPDATE public.quiz_attempts
  SET status = 'submitted', submitted_at = now(), score = v_earned_marks, total_marks = v_total_marks, percentage = v_percentage, updated_at = now()
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object('attempt_id', p_attempt_id, 'status', 'submitted', 'score', v_earned_marks, 'total_marks', v_total_marks, 'percentage', v_percentage);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- Courses Policies
DROP POLICY IF EXISTS "Courses viewable by authenticated users" ON public.courses;
CREATE POLICY "Courses viewable by authenticated users" ON public.courses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can create courses" ON public.courses;
CREATE POLICY "Staff can create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.is_staff() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Staff manage their assigned courses" ON public.courses;
CREATE POLICY "Staff manage their assigned courses" ON public.courses FOR UPDATE TO authenticated USING (public.can_manage_course(id)) WITH CHECK (public.can_manage_course(id));

DROP POLICY IF EXISTS "Admins or creators can delete courses" ON public.courses;
CREATE POLICY "Admins or creators can delete courses" ON public.courses FOR DELETE TO authenticated USING (public.is_admin() OR (public.is_lecturer() AND created_by = auth.uid()));

-- Course Members Policies
DROP POLICY IF EXISTS "Course members viewable by authenticated users" ON public.course_members;
CREATE POLICY "Course members viewable by authenticated users" ON public.course_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Course managers can manage membership" ON public.course_members;
CREATE POLICY "Course managers can manage membership" ON public.course_members FOR ALL TO authenticated USING (public.can_manage_course(course_id)) WITH CHECK (public.can_manage_course(course_id));

-- PDF Imports Policies (Students Denied)
DROP POLICY IF EXISTS "Staff can view pdf imports for their courses" ON public.pdf_imports;
CREATE POLICY "Staff can view pdf imports for their courses" ON public.pdf_imports FOR SELECT TO authenticated USING (public.can_manage_course(course_id));

DROP POLICY IF EXISTS "Staff can upload pdf imports for their courses" ON public.pdf_imports;
CREATE POLICY "Staff can upload pdf imports for their courses" ON public.pdf_imports FOR INSERT TO authenticated WITH CHECK (public.can_manage_course(course_id) AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Staff can update pdf imports for their courses" ON public.pdf_imports;
CREATE POLICY "Staff can update pdf imports for their courses" ON public.pdf_imports FOR UPDATE TO authenticated USING (public.can_manage_course(course_id)) WITH CHECK (public.can_manage_course(course_id));

DROP POLICY IF EXISTS "Staff can delete pdf imports for their courses" ON public.pdf_imports;
CREATE POLICY "Staff can delete pdf imports for their courses" ON public.pdf_imports FOR DELETE TO authenticated USING (public.can_manage_course(course_id));

-- Quizzes Policies
DROP POLICY IF EXISTS "Students view published quizzes" ON public.quizzes;
CREATE POLICY "Students view published quizzes" ON public.quizzes FOR SELECT TO authenticated USING (status = 'published' OR public.can_manage_course(course_id) OR public.is_admin());

DROP POLICY IF EXISTS "Staff can create quizzes for their courses" ON public.quizzes;
CREATE POLICY "Staff can create quizzes for their courses" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (public.can_manage_course(course_id) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Staff can update their quizzes" ON public.quizzes;
CREATE POLICY "Staff can update their quizzes" ON public.quizzes FOR UPDATE TO authenticated USING (public.can_manage_quiz(id)) WITH CHECK (public.can_manage_quiz(id));

DROP POLICY IF EXISTS "Staff can delete their quizzes" ON public.quizzes;
CREATE POLICY "Staff can delete their quizzes" ON public.quizzes FOR DELETE TO authenticated USING (public.can_manage_quiz(id));

-- Questions Policies
DROP POLICY IF EXISTS "Questions viewable for accessible quizzes" ON public.questions;
CREATE POLICY "Questions viewable for accessible quizzes" ON public.questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = questions.quiz_id AND (q.status = 'published' OR public.can_manage_quiz(q.id))));

DROP POLICY IF EXISTS "Staff can insert questions" ON public.questions;
CREATE POLICY "Staff can insert questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (public.can_manage_quiz(quiz_id));

DROP POLICY IF EXISTS "Staff can update questions" ON public.questions;
CREATE POLICY "Staff can update questions" ON public.questions FOR UPDATE TO authenticated USING (public.can_manage_question(id)) WITH CHECK (public.can_manage_question(id));

DROP POLICY IF EXISTS "Staff can delete questions" ON public.questions;
CREATE POLICY "Staff can delete questions" ON public.questions FOR DELETE TO authenticated USING (public.can_manage_question(id));

-- Answer Options Policies
DROP POLICY IF EXISTS "Answer options viewable for accessible questions" ON public.answer_options;
CREATE POLICY "Answer options viewable for accessible questions" ON public.answer_options FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.questions q JOIN public.quizzes qz ON qz.id = q.quiz_id WHERE q.id = answer_options.question_id AND (qz.status = 'published' OR public.can_manage_quiz(qz.id))));

DROP POLICY IF EXISTS "Staff can manage answer options" ON public.answer_options;
CREATE POLICY "Staff can manage answer options" ON public.answer_options FOR ALL TO authenticated USING (public.can_manage_question(question_id)) WITH CHECK (public.can_manage_question(question_id));

-- Quiz Attempts Policies
DROP POLICY IF EXISTS "Students view own attempts; Staff view course attempts" ON public.quiz_attempts;
CREATE POLICY "Students view own attempts; Staff view course attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.can_manage_quiz(quiz_id) OR public.is_admin());

DROP POLICY IF EXISTS "Students can start attempts" ON public.quiz_attempts;
CREATE POLICY "Students can start attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() AND status = 'in_progress' AND score IS NULL AND total_marks IS NULL AND percentage IS NULL);

DROP POLICY IF EXISTS "Students can update their own in-progress attempt" ON public.quiz_attempts;
CREATE POLICY "Students can update their own in-progress attempt" ON public.quiz_attempts FOR UPDATE TO authenticated USING (student_id = auth.uid() AND status = 'in_progress') WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Staff can manage attempts for their quizzes" ON public.quiz_attempts;
CREATE POLICY "Staff can manage attempts for their quizzes" ON public.quiz_attempts FOR ALL TO authenticated USING (public.can_manage_quiz(quiz_id)) WITH CHECK (public.can_manage_quiz(quiz_id));

-- Attempt Answers Policies
DROP POLICY IF EXISTS "Students view own attempt answers; Staff view course answers" ON public.attempt_answers;
CREATE POLICY "Students view own attempt answers; Staff view course answers" ON public.attempt_answers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_answers.attempt_id AND (qa.student_id = auth.uid() OR public.can_manage_quiz(qa.quiz_id))));

DROP POLICY IF EXISTS "Students can submit answers for their in-progress attempt" ON public.attempt_answers;
CREATE POLICY "Students can submit answers for their in-progress attempt" ON public.attempt_answers FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_answers.attempt_id AND qa.student_id = auth.uid() AND qa.status = 'in_progress') AND is_correct IS NULL AND marks_awarded = 0);

DROP POLICY IF EXISTS "Students can update answers for their in-progress attempt" ON public.attempt_answers;
CREATE POLICY "Students can update answers for their in-progress attempt" ON public.attempt_answers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_answers.attempt_id AND qa.student_id = auth.uid() AND qa.status = 'in_progress')) WITH CHECK (EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_answers.attempt_id AND qa.student_id = auth.uid() AND qa.status = 'in_progress'));

-- ------------------------------------------------------------------------------
-- 13. SEED DEFAULT ACCOUNTS FOR ALL 4 ROLES (PASSWORD: Password123!)
-- ------------------------------------------------------------------------------

-- Helper function to provision or update a confirmed seed user in auth.users + public.profiles
CREATE OR REPLACE FUNCTION public.seed_user(
  p_email text,
  p_password text,
  p_display_name text,
  p_role text
) RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_encrypted_password text;
BEGIN
  -- Compute blowfish hash using pgcrypto
  v_encrypted_password := crypt(p_password, gen_salt('bf'));

  -- Check if user exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      p_email,
      v_encrypted_password,
      now(), -- Pre-confirm email so login works immediately!
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('display_name', p_display_name, 'role', p_role),
      'authenticated',
      'authenticated',
      now(),
      now()
    );

    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_email),
      'email',
      p_email,
      now(),
      now(),
      now()
    );
  ELSE
    -- If user already exists, update their password and confirmed status
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_password,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('display_name', p_display_name, 'role', p_role),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Ensure matching profile in public.profiles with exact role
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (v_user_id, p_email, p_display_name, p_role)
  ON CONFLICT (id) DO UPDATE
  SET 
    role = p_role,
    display_name = p_display_name,
    email = p_email,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provision user's personal Super Admin account + sample role accounts (Password: Password123!)
SELECT public.seed_user('ankomahjulius959@gmail.com', 'Password123!', 'Julius Ankomah (Super Admin)', 'super_admin');
SELECT public.seed_user('superadmin@university.edu', 'Password123!', 'Dr. Julius (Super Admin)', 'super_admin');
SELECT public.seed_user('admin@university.edu', 'Password123!', 'Academic Registrar (Admin)', 'admin');
SELECT public.seed_user('lecturer@university.edu', 'Password123!', 'Prof. Marcus Chen (Lecturer)', 'lecturer');
SELECT public.seed_user('student@university.edu', 'Password123!', 'Alexander Rivera (Student)', 'student');

-- Drop temporary seed helper function
DROP FUNCTION public.seed_user(text, text, text, text);
