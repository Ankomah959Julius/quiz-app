# Security Policies & Row Level Security (RLS) — Stage 2

This document details the Row Level Security (RLS) architecture, privilege escalation prevention, and student answer protections.

---

## 1. Privilege Escalation Defenses

### 1.1 New User Registration
- Handled via `auth.users` trigger (`handle_new_user()`).
- New profiles are automatically forced to `role = 'student'`, regardless of any client-sent metadata.

### 1.2 Non-Admin Role Tampering
- Enforced via database trigger `check_profile_role_update`:
  ```sql
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only Super Admins can alter user roles.';
    END IF;
  END IF;
  ```
- Any direct REST API or frontend attempt to modify `role` throws an immediate PostgreSQL exception.

---

## 2. Correct Answer Protection

### 2.1 Masked Safe View (`quiz_options_student_safe`)
- Students querying options do not receive `is_correct`:
  ```sql
  CASE
    WHEN public.is_admin() OR public.can_manage_question(ao.question_id) THEN ao.is_correct
    ELSE NULL
  END AS is_correct
  ```
- Before or during an ongoing quiz, the browser network payload never contains the answer keys.

---

## 3. Score & Grading Tampering Protection

### 3.1 Direct Score Updates Blocked
- Enforced via trigger `check_attempt_score_update` on `quiz_attempts`:
  - Students cannot update `score`, `total_marks`, or `percentage`.
  - Any PATCH request modifying score values throws an exception.

### 3.2 Direct Answer Grading Blocked
- Enforced via trigger `check_attempt_answer_update` on `attempt_answers`:
  - Students cannot set `is_correct` or `marks_awarded`.

### 3.3 Server-Side Stored Procedure (`submit_quiz_attempt`)
- When a quiz is submitted, the frontend invokes `rpc('submit_quiz_attempt', { p_attempt_id })`.
- Grading runs in a `SECURITY DEFINER` function on PostgreSQL:
  - Compares `selected_option_id` against `answer_options.is_correct`.
  - Calculates earned marks, total marks, and percentage.
  - Seals the attempt with `status = 'submitted'` and timestamp.

---

## 4. Summary of RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | All authenticated | Trigger on Auth | Self only (cannot change role) | Admins only |
| `courses` | All authenticated | Staff only (`created_by = auth.uid()`) | Course managers & Admins | Creator / Admin |
| `course_members` | All authenticated | Course managers & Admins | Course managers & Admins | Course managers & Admins |
| `pdf_imports` | Course staff & Admins | Course staff & Admins | Course staff & Admins | Course staff & Admins |
| `quizzes` | Published (Students) / All (Staff) | Course staff & Admins | Quiz creator & Admins | Quiz creator & Admins |
| `questions` | Published quizzes (Students) / All (Staff) | Quiz creator & Admins | Quiz creator & Admins | Quiz creator & Admins |
| `answer_options` | Associated quiz viewable | Quiz creator & Admins | Quiz creator & Admins | Quiz creator & Admins |
| `quiz_attempts` | Own attempts (Students) / Course attempts (Staff) | Self (`in_progress` only) | Self (in-progress only; scores locked) | Admins only |
| `attempt_answers` | Own answers (Students) / Course answers (Staff) | Self for own in-progress attempt | Self for own in-progress attempt | Admins only |
