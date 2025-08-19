# Prompt for Building AI-Powered Interview Feature

## Overview

You are an expert full-stack developer tasked with building a new feature for an existing React + Supabase application. This feature is an AI-powered interview platform with four steps: 1. Setup, 2. Questions, 3. Candidates, and 4. Interviews. The platform allows recruiters to set up job interviews, generate or add questions (using OpenAI key), manage candidates (fetched from the existing `talent_searches` table in Supabase or manually searched we got a dedicated page for that TalentSearchPage and its edge function), and conduct/view interviews (implement with dummy data and a basic template, without biometric analysis as no provider is selected yet).

Before starting, **analyze the existing codebase** to understand the structure, tech stack (React for frontend, Supabase for database and auth, Supabase edge functions for backend logic), routing, components, and any relevant tables/services. If anything is ambiguous (e.g., how to integrate with existing auth, UI components, or n8n workflows), scan the code files, database schema, and configurations to resolve it.

## Step-by-Step Requirements

### 1. Database Schema

- Analyze existing schema. Ensure `talent_searches` table exists (with fields like id, name, email, resume_url, etc.).
- Create new tables if not present:
  - `interviews`: id (uuid), user_id (foreign key to users), job_title (string), job_description (text), num_questions (integer), created_at (timestamp).
  - `interview_questions`: id (uuid), interview_id (foreign key), question_text (text), is_ai_generated (boolean).
  - `interview_candidates`: id (uuid), interview_id (foreign key), candidate_id (foreign key to talent_searches or manual fields: name, email), status (string, e.g., 'pending', 'completed').
  - `interview_results` (for dummy): id (uuid), candidate_id (foreign key), score (integer), notes (text).
- Use Supabase SQL editor or migrations to add these.

### 2. Backend Edge Functions

- Create Supabase edge functions (in Deno/TypeScript) for:
  - `create-interview`: POST endpoint to save setup data (job_title, job_description, num_questions) and return interview_id.
  - `generate-questions`: POST endpoint that takes interview_id, uses OpenAI to generate questions based on job_title/description. Prompt example: "Generate {num_questions} interview questions for a {job_title} role: {job_description}". Save to `interview_questions` with is_ai_generated=true.
  - `add-manual-question`: POST to add user-input questions to `interview_questions`.
  - `fetch-candidates`: GET to fetch from `talent_searches` table (filter by user_id if needed).
  - `search-candidates`: POST to trigger existing n8n workflow for manual search (assume an API like `/n8n/search` exists; pass query params like job_title).
  - `add-candidate`: POST to link candidates to interview (either from talent_searches or manual).
  - `get-interview-data`: GET to fetch all data for an interview_id (for frontend loading).
  - `simulate-interview`: POST for dummy interviews – generate mock results (e.g., random score 1-100, notes like "Good performance") and save to `interview_results`.
- Handle auth with Supabase (e.g., check session).
- Integrate OpenAI: Import `openai` package if available in Deno, or use fetch to API. Key: `Deno.env.get('OPENAI_API')`.

### 3. Frontend Implementation

- Create a new route `/interview` (or sub-routes) using React Router if existing.
- Main component: `InterviewWizard` with state management (e.g., useState or Redux if existing) for current step and data.
- Progress bar: Horizontal stepper with icons/labels for steps: Setup, Questions, Candidates, Interviews.
- Navigation: Tabs/buttons to switch steps (disable later steps until previous completed).
- Forms: Use existing form components or libraries like React Hook Form.

#### Step 1: Setup

- Form fields:
  - Job Title (required, input).
  - Job Description (optional, textarea).
  - Number of Questions (integer, default 5).
- Button: "Generate Questions with AI" (calls generate-questions endpoint) or "Next" to proceed manually.
- Validation: Ensure title is filled.

#### Step 2: Questions

- Display list of questions (fetched from DB).
- Options: Auto-generate via AI (if not done in setup), add manual questions (input field + add button), edit/delete existing.
- Button: "Save and Next".

#### Step 3: Candidates

- Fetch and display candidates from `talent_searches` (table or list with name, email).
- Search bar for manual search: Input query, call search-candidates endpoint (via n8n), add selected to interview.
- Add manual candidate: Fields for name, email.
- Selected candidates list with remove option.
- Button: "Next".

#### Step 4: Interviews

- Display list of added candidates.
- For each: Button "Start Interview" (simulates: calls simulate-interview, shows dummy results like score, notes).
- Template: Table with columns: Candidate Name, Status, Score, Notes (use dummies like score=85, notes="Placeholder result").
- No biometric: Just placeholders, e.g., "Biometric analysis coming soon".
- Button: "View Results" or "Export".

### 4. Integration and Testing

- Ensure data persists across steps (save to DB after each).
- Handle loading/errors with toasts if existing.
- Test: Create sample interview, generate questions, add candidates, simulate results.
- If ambiguous (e.g., n8n API details), scan code for endpoints/hooks.

## Final Output Guidelines

- Provide code snippets for each part (e.g., table creations, function code, React components).
- Use markdown code blocks.
- Explain any assumptions or code scans needed.
