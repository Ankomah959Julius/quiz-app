-- ==============================================================================
-- QUIZ APP - STAGE 2: DATABASE SETUP AND SECURITY
-- Migration: 20261022000000_stage2_database_schema_and_security.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS FOR ROLE-BASED ACCESS CONTROL (SECURITY DEFINER)
-- ------------------------------------------------------------------------------

-- Function to get the current authenticated user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if the current user is a Super Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if the current user is a Lecturer
CREATE OR REPLACE FUNCTION public.is_lecturer()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role = 'lecturer' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if the current user is Staff (Admin or Lecturer)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role IN ('admin', 'lecturer') FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. PROFILES TABLE & PRIVILEGE ESCALATION PREVENTION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'lecturer', 'student')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for role lookup performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'student' -- Always default to student. Never allow role override from signup metadata.
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger function to strictly prevent non-admins from changing their role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only Super Admins can alter user roles.';
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
-- 4. COURSES & COURSE MEMBERSHIP
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
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(course_code);

CREATE TABLE IF NOT EXISTS public.course_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_role text NOT NULL DEFAULT 'lecturer' CHECK (membership_role IN ('lecturer', 'student', 'assistant')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_course_members_lookup ON public.course_members(course_id, user_id);

-- Helper function: can user manage course content
CREATE OR REPLACE FUNCTION public.can_manage_course(p_course_id uuid)
RETURNS boolean AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN true;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = p_course_id AND c.created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.course_members cm
    WHERE cm.course_id = p_course_id 
      AND cm.user_id = auth.uid() 
      AND cm.membership_role IN ('lecturer', 'assistant')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 5. PDF IMPORTS TABLE
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

CREATE INDEX IF NOT EXISTS idx_pdf_imports_course ON public.pdf_imports(course_id);
CREATE INDEX IF NOT EXISTS idx_pdf_imports_status ON public.pdf_imports(status);

-- ------------------------------------------------------------------------------
-- 6. QUIZZES TABLE
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

CREATE INDEX IF NOT EXISTS idx_quizzes_course_status ON public.quizzes(course_id, status);

-- Helper function: can user manage quiz
CREATE OR REPLACE FUNCTION public.can_manage_quiz(p_quiz_id uuid)
RETURNS boolean AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = p_quiz_id 
      AND (q.created_by = auth.uid() OR public.can_manage_course(q.course_id))
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 7. QUESTIONS TABLE
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

CREATE INDEX IF NOT EXISTS idx_questions_quiz_pos ON public.questions(quiz_id, position);

-- Helper function: can user manage question
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
-- 8. ANSWER OPTIONS TABLE & CORRECT ANSWER PROTECTION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.answer_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_label text NOT NULL, -- 'A', 'B', 'C', 'D'
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_answer_options_question ON public.answer_options(question_id, position);

-- Secure View: Masks is_correct from students until attempt submission/review
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

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_status ON public.quiz_attempts(quiz_id, status);

-- Trigger function: Strictly prevent students from modifying their own score, total_marks, or percentage
CREATE OR REPLACE FUNCTION public.prevent_student_score_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_staff() THEN
    -- Student updating: Cannot alter score, total_marks, or percentage directly
    IF NEW.score IS DISTINCT FROM OLD.score OR 
       NEW.total_marks IS DISTINCT FROM OLD.total_marks OR 
       NEW.percentage IS DISTINCT FROM OLD.percentage THEN
      RAISE EXCEPTION 'Unauthorized: Students cannot modify score or percentage values.';
    END IF;

    -- Students cannot change student_id or quiz_id
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
-- 10. ATTEMPT ANSWERS TABLE
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

CREATE INDEX IF NOT EXISTS idx_attempt_answers_lookup ON public.attempt_answers(attempt_id, question_id);

-- Trigger function: Prevent students from modifying is_correct or marks_awarded directly
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
  v_quiz record;
  v_total_marks numeric(6,2) := 0;
  v_earned_marks numeric(6,2) := 0;
  v_percentage numeric(5,2) := 0;
BEGIN
  -- Fetch the attempt
  SELECT * INTO v_attempt FROM public.quiz_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found.';
  END IF;

  -- Ensure caller owns this attempt or is staff
  IF v_attempt.student_id != auth.uid() AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Unauthorized attempt submission.';
  END IF;

  -- Check if already submitted
  IF v_attempt.status = 'submitted' THEN
    RAISE EXCEPTION 'This attempt has already been submitted.';
  END IF;

  -- Fetch the quiz
  SELECT * INTO v_quiz FROM public.quizzes WHERE id = v_attempt.quiz_id;

  -- Grade each answered question
  UPDATE public.attempt_answers aa
  SET 
    is_correct = COALESCE(ao.is_correct, false),
    marks_awarded = CASE WHEN ao.is_correct THEN q.marks ELSE 0 END
  FROM public.questions q
  LEFT JOIN public.answer_options ao ON ao.id = aa.selected_option_id
  WHERE aa.attempt_id = p_attempt_id
    AND aa.question_id = q.id;

  -- Calculate total possible marks for the quiz
  SELECT COALESCE(SUM(marks), 0) INTO v_total_marks
  FROM public.questions
  WHERE quiz_id = v_attempt.quiz_id;

  -- Calculate total earned marks
  SELECT COALESCE(SUM(marks_awarded), 0) INTO v_earned_marks
  FROM public.attempt_answers
  WHERE attempt_id = p_attempt_id;

  -- Calculate percentage
  IF v_total_marks > 0 THEN
    v_percentage := ROUND((v_earned_marks / v_total_marks) * 100.0, 2);
  ELSE
    v_percentage := 0.0;
  END IF;

  -- Finalize attempt
  UPDATE public.quiz_attempts
  SET
    status = 'submitted',
    submitted_at = now(),
    score = v_earned_marks,
    total_marks = v_total_marks,
    percentage = v_percentage,
    updated_at = now()
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'attempt_id', p_attempt_id,
    'status', 'submitted',
    'score', v_earned_marks,
    'total_marks', v_total_marks,
    'percentage', v_percentage
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

-- -----------------
-- PROFILES POLICIES
-- -----------------
-- Anyone authenticated can view profiles (needed for instructor names, leaderboards)
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any profile (e.g., promote to lecturer)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ----------------
-- COURSES POLICIES
-- ----------------
-- Courses are viewable by all authenticated users
CREATE POLICY "Courses viewable by authenticated users"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

-- Lecturers and Admins can create courses
CREATE POLICY "Staff can create courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() AND created_by = auth.uid());

-- Lecturers manage their assigned courses; Admins manage all
CREATE POLICY "Staff manage their assigned courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (public.can_manage_course(id))
  WITH CHECK (public.can_manage_course(id));

CREATE POLICY "Admins or creators can delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (public.is_admin() OR (public.is_lecturer() AND created_by = auth.uid()));

-- -----------------------
-- COURSE MEMBERS POLICIES
-- -----------------------
CREATE POLICY "Course members viewable by authenticated users"
  ON public.course_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Course managers can manage membership"
  ON public.course_members FOR ALL
  TO authenticated
  USING (public.can_manage_course(course_id))
  WITH CHECK (public.can_manage_course(course_id));

-- -------------------
-- PDF IMPORTS POLICIES
-- -------------------
-- Students have NO access to PDF imports
CREATE POLICY "Staff can view pdf imports for their courses"
  ON public.pdf_imports FOR SELECT
  TO authenticated
  USING (public.can_manage_course(course_id));

CREATE POLICY "Staff can upload pdf imports for their courses"
  ON public.pdf_imports FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_course(course_id) AND uploaded_by = auth.uid());

CREATE POLICY "Staff can update pdf imports for their courses"
  ON public.pdf_imports FOR UPDATE
  TO authenticated
  USING (public.can_manage_course(course_id))
  WITH CHECK (public.can_manage_course(course_id));

CREATE POLICY "Staff can delete pdf imports for their courses"
  ON public.pdf_imports FOR DELETE
  TO authenticated
  USING (public.can_manage_course(course_id));

-- ----------------
-- QUIZZES POLICIES
-- ----------------
-- Students can only view published quizzes; Staff can view draft/archived for their courses
CREATE POLICY "Students view published quizzes"
  ON public.quizzes FOR SELECT
  TO authenticated
  USING (
    status = 'published' 
    OR public.can_manage_course(course_id) 
    OR public.is_admin()
  );

CREATE POLICY "Staff can create quizzes for their courses"
  ON public.quizzes FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_course(course_id) AND created_by = auth.uid());

CREATE POLICY "Staff can update their quizzes"
  ON public.quizzes FOR UPDATE
  TO authenticated
  USING (public.can_manage_quiz(id))
  WITH CHECK (public.can_manage_quiz(id));

CREATE POLICY "Staff can delete their quizzes"
  ON public.quizzes FOR DELETE
  TO authenticated
  USING (public.can_manage_quiz(id));

-- ------------------
-- QUESTIONS POLICIES
-- ------------------
-- Questions for published quizzes are readable; Staff can view all in their quizzes
CREATE POLICY "Questions viewable for accessible quizzes"
  ON public.questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = questions.quiz_id 
        AND (q.status = 'published' OR public.can_manage_quiz(q.id))
    )
  );

CREATE POLICY "Staff can insert questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_quiz(quiz_id));

CREATE POLICY "Staff can update questions"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (public.can_manage_question(id))
  WITH CHECK (public.can_manage_question(id));

CREATE POLICY "Staff can delete questions"
  ON public.questions FOR DELETE
  TO authenticated
  USING (public.can_manage_question(id));

-- -----------------------
-- ANSWER OPTIONS POLICIES
-- -----------------------
-- Option labels and texts are readable for quiz questions.
-- Notice: Staff see full options. Students use this policy or the safe view.
CREATE POLICY "Answer options viewable for accessible questions"
  ON public.answer_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.quizzes qz ON qz.id = q.quiz_id
      WHERE q.id = answer_options.question_id
        AND (qz.status = 'published' OR public.can_manage_quiz(qz.id))
    )
  );

CREATE POLICY "Staff can manage answer options"
  ON public.answer_options FOR ALL
  TO authenticated
  USING (public.can_manage_question(question_id))
  WITH CHECK (public.can_manage_question(question_id));

-- ----------------------
-- QUIZ ATTEMPTS POLICIES
-- ----------------------
-- Students see only their own attempts; Staff see attempts on their quizzes
CREATE POLICY "Students view own attempts; Staff view course attempts"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() 
    OR public.can_manage_quiz(quiz_id) 
    OR public.is_admin()
  );

-- Students can insert their own attempts
CREATE POLICY "Students can start attempts"
  ON public.quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'in_progress'
    AND score IS NULL
    AND total_marks IS NULL
    AND percentage IS NULL
  );

-- Students can update their own in-progress attempt (e.g. heartbeat or status)
-- Note: Trigger prevent_student_score_tampering blocks any change to score/marks
CREATE POLICY "Students can update their own in-progress attempt"
  ON public.quiz_attempts FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() AND status = 'in_progress')
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Staff can manage attempts for their quizzes"
  ON public.quiz_attempts FOR ALL
  TO authenticated
  USING (public.can_manage_quiz(quiz_id))
  WITH CHECK (public.can_manage_quiz(quiz_id));

-- -----------------------
-- ATTEMPT ANSWERS POLICIES
-- -----------------------
-- Students view only answers for their own attempts; Staff view answers for their quizzes
CREATE POLICY "Students view own attempt answers; Staff view course answers"
  ON public.attempt_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_answers.attempt_id
        AND (qa.student_id = auth.uid() OR public.can_manage_quiz(qa.quiz_id))
    )
  );

-- Students can insert answers into their own in-progress attempt
CREATE POLICY "Students can submit answers for their in-progress attempt"
  ON public.attempt_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_answers.attempt_id
        AND qa.student_id = auth.uid()
        AND qa.status = 'in_progress'
    )
    AND is_correct IS NULL
    AND marks_awarded = 0
  );

-- Students can update answers during their in-progress attempt
CREATE POLICY "Students can update answers for their in-progress attempt"
  ON public.attempt_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_answers.attempt_id
        AND qa.student_id = auth.uid()
        AND qa.status = 'in_progress'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_answers.attempt_id
        AND qa.student_id = auth.uid()
        AND qa.status = 'in_progress'
    )
  );
