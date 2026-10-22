# Quiz Platform --- Project Requirements and Development Guide

**Document purpose:** This document describes the intended features,
user roles, technology stack, security requirements, and implementation
stages for the quiz platform. Google Antigravity should read this
document before making project changes and use it as the main source of
project requirements.

**Project status:** Initial requirements\
**Frontend:** React + Vite\
**Backend services:** Supabase\
**Database:** Supabase PostgreSQL\
**Primary users:** Super Admin, Lecturer, Student

------------------------------------------------------------------------

## 1. Project Overview

Build a professional, responsive online quiz platform for academic use.
Authorized staff should be able to upload PDF question papers, have the
system extract questions and answer options, review the extracted
content, and publish verified quizzes. Students should be able to take
quizzes online, receive scores, review their own results, and see
rankings on quiz-specific and overall leaderboards.

The platform must be built in manageable stages. Prioritize a secure and
reliable foundation over trying to build every feature at once.

### Main goals

1.  Provide a clear and attractive user interface for students and
    staff.
2.  Allow authorized staff to upload question papers in PDF format.
3.  Extract questions and options from PDFs as automatically as
    practical.
4.  Require a human review step before extracted questions become
    available to students.
5.  Support timed quizzes, answer submission, automatic scoring, and
    result history.
6.  Display fair and understandable leaderboards.
7.  Protect student data, quiz answers, scores, and administrative
    functions.
8.  Use Supabase for authentication, database, storage, and server-side
    functions where appropriate.

------------------------------------------------------------------------

## 2. Technology Stack

### Required

-   **React** for the frontend UI.
-   **Vite** as the frontend development and build tool.
-   **Supabase Auth** for registration, login, and session management.
-   **Supabase PostgreSQL** for persistent application data.
-   **Supabase Storage** for uploaded PDF files.
-   **Supabase Edge Functions** or another secure server-side processing
    service when privileged operations or PDF processing require it.
-   **Git** for version control.

### Styling

Use one consistent styling approach throughout the project. Tailwind CSS
is acceptable for rapid, consistent styling. Regular CSS or CSS Modules
are also acceptable if the project already uses them. Do not mix
multiple styling systems without a clear reason.

### PDF processing

The PDF import feature must account for two types of documents:

1.  **Text-based PDFs:** extract selectable text using a suitable PDF
    parsing library in a secure processing environment.
2.  **Scanned PDFs:** use OCR (optical character recognition) to read
    text from page images.

Question extraction must not assume that every PDF follows the same
layout. The system should identify uncertain or incorrectly parsed
content and allow staff to correct it.

Do not assume that Supabase Storage alone extracts questions from PDFs.
Implement a suitable processing workflow using a secure Edge Function or
another documented processing service. If a third-party AI service is
used, keep its secret key server-side and document any cost, privacy,
and configuration requirements.

------------------------------------------------------------------------

## 3. User Roles and Permissions

The platform has three primary roles.

### 3.1 Super Admin

The Super Admin controls the platform.

Permissions: - View the platform overview and high-level activity. -
Create, edit, deactivate, and manage staff accounts or role
assignments. - Access and manage all courses and quizzes. - Upload,
review, publish, unpublish, and archive question sets. - View results
and leaderboard information across the platform. - Manage system-wide
settings. - Review relevant administrative activity logs.

Only a trusted, authorized user may receive the Super Admin role. Users
must not be able to grant this role to themselves by changing frontend
data or editing their profile.

### 3.2 Lecturer

A Lecturer manages academic content within their assigned courses.

Permissions: - Access assigned courses. - Upload PDF question papers for
assigned courses. - Review and edit questions extracted from their
PDFs. - Enter or verify correct answers and marks. - Create and manage
quizzes for assigned courses. - Publish or unpublish quizzes only where
permitted by policy. - View student attempts and results for their
assigned courses. - View relevant course leaderboards.

Lecturers must not be able to manage Super Admin accounts or access
unrelated courses unless explicitly authorized.

### 3.3 Student

A Student uses the platform to take quizzes and monitor performance.

Permissions: - Register and log in. - View published quizzes available
to them. - Take quizzes and submit answers. - View their own results and
previous attempts. - View quiz-specific and overall leaderboards. - View
their own profile and update permitted profile fields.

Students must not be able to upload question papers, edit questions,
publish quizzes, change scores, or access another student's private
attempt details.

### Optional future role

A separate support or content-review role may be introduced later if
needed. Do not add more roles to the first version unless they solve a
real requirement.

------------------------------------------------------------------------

## 4. PDF Upload and Question Extraction Workflow

This is one of the platform's core features.

### Step 1: Upload

An authorized Super Admin or Lecturer opens the PDF import page, selects
a PDF, and submits it.

The system should: - Validate file type and file size. - Show upload
progress and clear error messages. - Store the file in a private
Supabase Storage bucket. - Record the uploader, upload time, course, and
processing status. - Avoid exposing private PDF files through public
URLs.

### Step 2: Process the PDF

The processing service attempts to: - Extract text from text-based
PDFs. - Use OCR for scanned PDFs when supported. - Identify question
numbers and question text. - Identify options such as A, B, C, and D. -
Detect answer keys if present and if their format can be reliably
interpreted. - Preserve useful information such as question order and
page number. - Flag uncertain extraction results for manual correction.

The interface must clearly show processing states such as: - Uploaded -
Processing - Needs review - Ready to publish - Published - Failed

### Step 3: Review extracted questions

Before publishing, staff must be able to: - Read and edit each
question. - Edit, add, remove, and reorder answer options. - Select or
correct the right answer. - Set marks for each question. - Choose the
question type supported by the current version. - Delete incorrectly
extracted questions. - See questions that need attention. - Save
progress and return later.

The first version should prioritize multiple-choice questions with
options A, B, C, and D. The database and design should allow other
question types to be added later.

### Step 4: Verify the answer key

The system must not invent a correct answer when the PDF does not
contain a reliable answer key. If answers are absent or ambiguous, the
staff member must enter or verify the correct answers manually.

### Step 5: Configure and publish a quiz

Before publication, staff configure: - Quiz title and description. -
Course or subject. - Instructions. - Time limit, if applicable. -
Availability start and end times, if applicable. - Number of allowed
attempts. - Questions and marks. - Whether students may review answers
after submission. - Whether results and leaderboard entries appear
immediately or after review.

The system should block publication if required fields or correct
answers are missing.

------------------------------------------------------------------------

## 5. Quiz-Taking Experience

The student quiz interface should be simple, accessible, and easy to use
on desktop and mobile.

Required behavior: - Show the quiz title, instructions, question number,
and progress. - Display one question at a time or a clearly organized
question list. - Display answer options with large, usable selection
controls. - Allow students to move between questions when quiz rules
permit. - Show a timer when the quiz has a time limit. - Preserve
answers during the attempt where practical. - Ask for confirmation
before manual final submission. - Submit automatically when the timer
expires, if timed submission is enabled. - Prevent accidental duplicate
submissions. - Show a clear confirmation when submission succeeds. -
Handle refreshes, connectivity problems, and expired sessions safely.

Do not send correct answers to the student browser before submission.
Correctness must be evaluated by trusted database logic or secure
server-side logic, not by trusting the frontend.

------------------------------------------------------------------------

## 6. Scoring and Results

The platform should calculate scores consistently.

Each question has a mark value. The score is calculated from the
submitted answers and verified answer key. The result should include: -
Student identity or display name, according to privacy settings. - Quiz
title. - Score earned. - Total possible marks. - Percentage score. -
Submission date and time. - Attempt number. - Correct/incorrect totals
where appropriate and allowed. - Feedback or answer review, only if
enabled for that quiz.

Students may view their own results and history. Lecturers may view
results only for courses they are permitted to manage. Super Admins may
view platform-wide results.

The client must never be trusted to submit its own final score. Scores
should be calculated or verified in trusted backend/database logic.

------------------------------------------------------------------------

## 7. Leaderboards

The platform should include two types of leaderboard.

### 7.1 Quiz-specific leaderboard

Ranks eligible students for one quiz.

Display: - Rank - Student display name - Score or percentage -
Submission time or completion time only if appropriate - The current
user's own position

### 7.2 Overall leaderboard

Shows overall performance across quizzes. Define the ranking calculation
clearly and document it. A reasonable initial approach is to use the
average percentage across eligible completed attempts, with rules that
prevent students who have completed very few quizzes from being
misleadingly ranked above others. The exact rule should be configurable
or clearly explained to users.

### Ranking rules

-   Use a consistent tie-breaking policy, such as percentage first and
    then completion time where relevant.
-   Do not expose private student details, email addresses, or private
    answer records.
-   Show only published or otherwise eligible attempts.
-   Prevent students from changing scores or leaderboard records.
-   Consider whether retakes replace the best score, use the latest
    score, or count all attempts. Make the policy explicit per quiz.
-   Keep the quiz-specific and overall ranking calculations consistent
    with the stated rules.

------------------------------------------------------------------------

## 8. Main Pages and User Interface

Build a polished, professional, responsive interface with a consistent
design system, readable typography, clear spacing, accessible contrast,
useful empty states, and helpful loading and error states.

### Public and authentication pages

-   Landing page
-   Login page
-   Registration page
-   Password recovery page
-   Access-denied or not-found page

### Student pages

-   Student dashboard
-   Available quizzes
-   Quiz instructions
-   Take quiz
-   Submission confirmation
-   Results and attempt history
-   Quiz leaderboard
-   Overall leaderboard
-   Profile and settings

### Lecturer pages

-   Lecturer dashboard
-   Assigned courses
-   PDF upload and import history
-   Question review/editor
-   Quiz creation and settings
-   Published and draft quizzes
-   Course results and leaderboard

### Super Admin pages

-   Platform overview
-   User and role management
-   Course management
-   Quiz and question management
-   PDF import monitoring
-   Results and leaderboard overview
-   Activity log and platform settings

Navigation and visible actions must reflect the current user's role.
However, frontend visibility is not security: permissions must also be
enforced by Supabase policies and secure server-side operations.

------------------------------------------------------------------------

## 9. Suggested Database Design

Create version-controlled SQL migrations in the `supabase/migrations/`
directory. Review and test the schema and policies before applying them
to a live project.

Suggested core tables:

### `profiles`

-   `id` --- matches the authenticated Supabase user ID
-   `display_name`
-   `role` --- constrained to permitted roles
-   `created_at`
-   `updated_at`

### `courses`

-   `id`
-   `name`
-   `course_code`
-   `description`
-   `created_by`
-   `created_at`

### `course_members`

-   `id`
-   `course_id`
-   `user_id`
-   `membership_role` or other suitable assignment information
-   `created_at`

Use this table, or an equivalent design, to represent lecturer
assignments and student enrollment where needed.

### `quizzes`

-   `id`
-   `course_id`
-   `title`
-   `description`
-   `status` --- for example, draft, published, archived
-   `duration_minutes`
-   `starts_at`
-   `ends_at`
-   `max_attempts`
-   `created_by`
-   `created_at`
-   `updated_at`

### `pdf_imports`

-   `id`
-   `storage_path`
-   `original_filename`
-   `uploaded_by`
-   `course_id`
-   `status`
-   `error_message`
-   `created_at`
-   `processed_at`

### `questions`

-   `id`
-   `quiz_id`
-   `pdf_import_id`, where applicable
-   `question_text`
-   `question_type`
-   `marks`
-   `position`
-   `verification_status`
-   `created_at`
-   `updated_at`

### `answer_options`

-   `id`
-   `question_id`
-   `option_text`
-   `option_label`
-   `is_correct`
-   `position`

Do not make correct-answer fields readable by students before
submission. Use restricted tables, secure views, or server-side
functions to expose only the information each user needs.

### `quiz_attempts`

-   `id`
-   `quiz_id`
-   `student_id`
-   `attempt_number`
-   `status`
-   `started_at`
-   `submitted_at`
-   `score`
-   `total_marks`
-   `percentage`

### `attempt_answers`

-   `id`
-   `attempt_id`
-   `question_id`
-   `selected_option_id`, where applicable
-   `answer_text`, for future question types if needed
-   `marks_awarded`
-   `is_correct`, where appropriate

Use foreign keys, constraints, indexes, and appropriate uniqueness
rules. The final schema may be adjusted as implementation details become
clearer, but changes must be documented.

------------------------------------------------------------------------

## 10. Security and Data Protection Requirements

Security is essential because the system contains correct answers,
student results, and administrative controls.

-   Enable Row Level Security (RLS) on all tables exposed through the
    Supabase client.
-   Write explicit policies for each role and each operation.
-   Deny access by default when a policy is not defined.
-   Validate role assignments using trusted logic; do not trust a role
    sent by the browser.
-   Do not allow users to make themselves Super Admins.
-   Keep Supabase secret/service-role keys and third-party API secrets
    out of frontend code and `VITE_` environment variables.
-   Use the Supabase publishable key in the frontend with correct RLS
    policies.
-   Keep PDF storage private and use authorized access or short-lived
    signed URLs where appropriate.
-   Validate uploads and limit permitted file types and sizes.
-   Do not reveal correct answers until the configured review stage.
-   Calculate or verify scores in trusted backend/database logic.
-   Prevent students from updating scores, attempt status, or another
    user's records.
-   Restrict lecturer access to assigned courses.
-   Avoid logging passwords, access tokens, or unnecessary sensitive
    information.
-   Provide useful error messages without exposing secrets or internal
    stack traces.
-   Document database policies and test them using separate Super Admin,
    Lecturer, and Student accounts.

------------------------------------------------------------------------

## 11. Recommended Project Structure

Use the existing Vite project if it has already been created. Adapt this
structure to the current files instead of deleting or recreating a
working project unnecessarily.

``` text
quiz-app/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── quiz/
│   │   │   ├── admin/
│   │   │   └── leaderboard/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── student/
│   │   │   ├── lecturer/
│   │   │   └── admin/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.local
│   ├── .env.example
│   └── package.json
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   └── process-pdf/
│   └── config.toml
├── docs/
│   ├── PROJECT_REQUIREMENTS.md
│   ├── DATABASE_DESIGN.md
│   ├── SECURITY_POLICIES.md
│   └── PDF_PROCESSING.md
├── .gitignore
└── README.md
```

Do not commit `.env.local` or any file containing real secrets. Keep
`.env.example` limited to placeholder variable names and safe example
values.

------------------------------------------------------------------------

## 12. Development Stages

Implement one stage at a time. Do not attempt to generate the whole
platform in a single large change.

### Stage 1 --- Inspect and plan

-   Inspect the existing repository and identify the current framework
    and files.
-   Confirm React + Vite is configured.
-   Propose a plan and note missing prerequisites.
-   Preserve working code and existing configuration.
-   Establish the design system and routing approach.

**Completion criteria:** The app runs locally, the project structure is
clear, and no existing working setup has been unnecessarily replaced.

### Stage 2 --- UI foundation

-   Create the shared layout, navigation, buttons, forms, cards, tables,
    and feedback states.
-   Build responsive page shells for the main roles.
-   Use realistic sample data only where necessary to develop the
    interface.
-   Clearly separate temporary mock data from real Supabase services.

**Completion criteria:** The main pages look coherent and work
responsively, even before backend integration.

### Stage 3 --- Supabase connection and authentication

-   Configure Supabase using environment variables.
-   Implement registration, login, logout, and session handling.
-   Add role-aware navigation and protected routes.
-   Build the database migration for profiles and role management.
-   Implement and test RLS policies.

**Completion criteria:** Real users can authenticate, and each role
receives only the permitted access.

### Stage 4 --- Courses and permissions

-   Implement courses and course assignments/enrollment.
-   Add Super Admin and Lecturer course-management interfaces.
-   Restrict lecturer operations to assigned courses.

**Completion criteria:** Course access and permissions are enforced by
the database and secure backend logic.

### Stage 5 --- PDF import

-   Add private PDF upload to Supabase Storage.
-   Add file validation and import status tracking.
-   Implement text extraction and an OCR path for scanned PDFs where
    supported.
-   Parse questions and options into structured records.
-   Report processing errors clearly.

**Completion criteria:** A test PDF can be uploaded and processed, with
extraction status and errors visible to authorized staff.

### Stage 6 --- Question review and quiz creation

-   Build the question editor.
-   Allow staff to verify answers, options, marks, and question order.
-   Add quiz settings, draft states, and publication rules.
-   Prevent publication of unverified or incomplete questions.

**Completion criteria:** Staff can turn an uploaded PDF into a verified,
publishable quiz.

### Stage 7 --- Quiz-taking and scoring

-   Build the student quiz experience.
-   Support timing, answer persistence where practical, submission, and
    attempt limits.
-   Store answers securely and calculate scores using trusted logic.
-   Prevent duplicate or unauthorized submissions.

**Completion criteria:** A student can complete a quiz and receive a
result that matches the verified answer key.

### Stage 8 --- Results and leaderboards

-   Build result history and permitted answer review.
-   Implement quiz-specific and overall leaderboards.
-   Apply documented ranking and tie-breaking rules.
-   Protect private student data.

**Completion criteria:** Scores and rankings reflect saved attempts and
cannot be manipulated through the browser.

### Stage 9 --- Testing and release preparation

-   Test each role and each RLS policy.
-   Test text-based PDFs, scanned PDFs if supported, malformed PDFs, and
    extraction errors.
-   Test desktop and mobile layouts.
-   Test timers, expired sessions, repeat attempts, ties, and failed
    submissions.
-   Document setup, environment variables, database migrations, Edge
    Functions, and deployment.

**Completion criteria:** Known limitations are documented, critical
security rules are tested, and setup instructions allow another
developer to run the project.

------------------------------------------------------------------------

## 13. Instructions for Google Antigravity

Before modifying the codebase:

1.  Read this document completely.
2.  Inspect the existing files and current Git state.
3.  Identify which stage the project is currently at.
4.  Summarize the planned changes before major implementation.
5.  Work only on the current stage unless explicitly asked to continue.
6.  Do not delete working code or replace configuration without a clear
    reason.
7.  Use real Supabase integrations when the relevant stage is reached.
    Do not claim a feature works if it is only a mockup.
8.  Keep components reasonably small and reusable.
9.  Keep data-access logic in services or dedicated modules rather than
    scattering it through UI components.
10. Use database migrations for schema changes and keep RLS policies
    version-controlled.
11. Do not put secret keys in frontend code.
12. Run the available checks and start the app when possible; fix errors
    caused by your changes.
13. Explain which files were changed, how to test the result, and which
    environment setup remains.
14. If a requirement is ambiguous, state the assumption and ask before
    making a major architectural decision.
15. Do not skip ahead to PDF processing before the authentication,
    database, and permission foundations are ready.

### First instruction to Antigravity

"Read `docs/PROJECT_REQUIREMENTS.md` completely. Inspect the current
repository without deleting or replacing existing working files. Tell me
what stage the project is at, identify missing prerequisites, and
propose the implementation plan for Stage 1. Do not implement later
stages yet."

------------------------------------------------------------------------

## 14. Initial Acceptance Checklist

The project is on the right track when:

-   [ ] The React app runs locally.
-   [ ] Supabase is configured using safe environment variables.
-   [ ] Super Admin, Lecturer, and Student permissions are defined.
-   [ ] Database migrations and RLS policies are version-controlled.
-   [ ] Staff can upload PDFs to private storage.
-   [ ] Extracted questions can be reviewed and corrected.
-   [ ] Unverified answers cannot be published.
-   [ ] Students can take published quizzes and submit answers.
-   [ ] Scores are calculated securely.
-   [ ] Students can view their own results.
-   [ ] Quiz-specific and overall leaderboards work.
-   [ ] The interface is responsive and accessible.
-   [ ] Setup and deployment instructions are documented.

------------------------------------------------------------------------

## 15. Scope Notes and Assumptions

-   The first release should prioritize multiple-choice quizzes.
-   Theory questions, advanced anti-cheating controls, certificates,
    payments, and advanced analytics can be considered later.
-   PDF parsing quality depends on document layout and scan quality;
    human review remains necessary.
-   AI-assisted extraction, if added, may require a separate provider
    and usage costs.
-   A leaderboard should not be treated as proof of identity or
    prevention of cheating.
-   Deployment, email delivery, OCR services, and external AI services
    may require additional setup.
-   All implementation decisions must prioritize security, correctness,
    maintainability, and a clear student experience.
