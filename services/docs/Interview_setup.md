# Interview Setup and Evaluation Guide

This document outlines the structure for setting up and evaluating recruitment interviews, including user input forms, test type descriptions, AI prompts for question generation, answer analysis, and a consolidated report format.

## 1. Interview Setup Form

### Basic Job Information

- **Job Title**: Text input for the job title (e.g., Software Engineer, Sales Manager).
- **Job Description**: Textarea for a detailed description of the job role and responsibilities.
- **Required Skills**: Tags input for key skills (e.g., Negotiation, CRM, Leadership).
- **Test Level**: Dropdown selection (Beginner, Intermediate, Advanced).

### Interview Settings

- **Interview Type**: Dropdown selection (Technical, Behavioral, Situational, Mixed).

### Test Types (Multi-Select Cards)

- Biometric Test
- IQ Test
- Psychometric Test
- Competency Test
- Emotional Intelligence (EQ) Test
- Situational Judgment Test (SJT)
- Technical Skills Test
- Language Proficiency Test

**Constraints**:

- For 15-minute interviews: Maximum of 2 test types (10 questions total).
- Example: 2 types, 30 minutes = 20 questions (10 per type).
- Example: 3 types, 30 minutes = 18 questions (6 per type). Do not exceed the limit.

---

## 2. Test Types: Descriptions and Benefits

| Test Type                            | Description                                                                                | Benefits                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| **Biometric Test**                   | Analyzes behavior during responses (voice tone, pauses, facial expressions).               | Reveals confidence, stress, focus, and honesty.                    |
| **IQ Test**                          | Logical, mathematical, and verbal reasoning multiple-choice questions.                     | Measures cognitive ability, problem-solving, and processing speed. |
| **Psychometric Test**                | Personality-style questionnaire (Big 5, DISC, etc.).                                       | Identifies cultural fit, personality traits, and work style.       |
| **Competency Test**                  | Job-related skill assessments (sales, marketing, coding, accounting).                      | Verifies real-world skills and role readiness.                     |
| **Emotional Intelligence (EQ) Test** | Situational questions assessing empathy, self-regulation, social skills.                   | Important for leadership, sales, HR, and customer service roles.   |
| **Situational Judgment Test (SJT)**  | Realistic job scenarios with multiple-choice options.                                      | Shows decision-making and problem-solving approaches.              |
| **Technical Skills Test**            | Role-specific coding challenges, case studies, or tool-based tasks.                        | Ensures technical proficiency beyond theory.                       |
| **Language Proficiency Test**        | Vocabulary, grammar, comprehension, and business communication (select language required). | Validates fluency for international or client-facing roles.        |

---

## NOTES

### First step

- open the field that has time duration property (15min 10 questions, 30min - 20 questions)
- Dropdown to choose the language of the questions
- so when clicking on the card type (IQ test => 15 min - 10 questions)
- 30 questins - 45 min = cost x credit (10 questions = 20 credit )
- then generate the questions and categorize them in tabs
- in the language profiency test let him select the language to test the language proffiency he wants.

### Second step

- Fetch talents to let him select one or mutliple canidadates from the db.

### Third step

- In the last page we would have a summary of the choosen candidates summary, of the questions and types of it.
- Each candidate would have its own link to join the interview indepently and have his own results and analysis of the his own answers. This link would be sent to his email and once he opens it, we show him a button to start the interview, maybe details of the hr.
- we would have a share button to send emails to the candidates and notify them with their interview link with an email template.
- after the links are received, the candidates join their interview and all the questions with an input to answer. each question is like 2 mintues long and the total duration of the test was determined by the first step to calculate all the timings.
- hr can start the interview, user can start the interview after he opens link from the email and then clicks start now.
- Of course we would save everything to the db. like the entire interview, generated questions, user (hr in this case), candidates, timestamps
  we will separate each candidate with his own answers and analysis for these answers.

## 3. AI Prompts

### A) Prompt to Generate Questions (Per Test Type)

**Prompt**:  
You are an AI Question Generator for recruitment interviews. Based on the following inputs, generate interview questions:

**Inputs**:

- Job Title: {{job_title}}
- Job Description: {{job_description}}
- Required Skills: {{skills}}
- Test Level: {{level}} (Beginner, Intermediate, Advanced)
- Selected Test Type: {{test_type}}
- Duration: {{duration_minutes}}

**Tasks**:

1. Generate {{number_of_questions}} questions relevant to the selected test type.
2. For each question, provide:
   - Question text
   - Expected model answer
   - Skill/trait being measured (e.g., leadership, problem-solving, coding).
3. Ensure questions are clear, job-related, and appropriate for the chosen test level.

---

### B) Prompts for Each Test Type

1. **Biometric Test**  
   Generate open-ended interview questions to allow behavioral analysis (confidence, stress, honesty). Include model answers and behavioral traits measured.

2. **IQ Test**  
   Generate logical, mathematical, or verbal multiple-choice questions with correct answers and explanations.

3. **Psychometric Test**  
   Generate personality-based questions to assess traits like openness, conscientiousness, extroversion, agreeableness, and stability. Provide interpretation guidelines.

4. **Competency Test**  
   Generate job-related skill assessment questions (practical or situational). Provide expected ideal answers and the competency being measured.

5. **Emotional Intelligence (EQ) Test**  
   Generate situational questions assessing empathy, self-awareness, self-regulation, and conflict management. Provide expected strong responses.

6. **Situational Judgment Test (SJT)**  
   Generate workplace scenario-based multiple-choice questions with analysis of best vs. worst options. Explain why each option is good or weak.

7. **Technical Skills Test**  
   Generate role-specific technical questions or challenges based on {{job_title}} and {{skills}}. Include correct solutions and scoring criteria.

8. **Language Proficiency Test**  
   Generate grammar, vocabulary, and comprehension questions in {{language}}. Provide correct answers and explanations.

---

### C) Prompt for Answer Analysis

**Prompt**:  
You are an AI Interview Evaluator. Analyze candidate responses based on model answers, test type, and (if available) biometric/behavioral signals.

**Inputs**:

- Candidate Name: {{candidate_name}}
- Job Title: {{job_title}}
- Questions with Model Answers: {{questions_and_model_answers}}
- Candidate Responses: {{candidate_responses}}
- Biometric/Behavioral Data: {{biometric_data}}

**Tasks**:

1. Score each answer on a scale of 0–100.
2. Highlight strengths and weaknesses per question.
3. Analyze behavioral data (confidence, stress, focus, honesty).
4. Provide an overall score per test type.
5. Generate a global summary across all tests.
6. Provide a final recommendation (Hire, Consider, Reject).

**Output Format**: Structured JSON with detailed evaluation.

---

## 4. Final Consolidated Report

### Header

- **Candidate Name**
- **Job Title**
- **Date of Interview**
- **Duration**
- **Tests Conducted**

---

### Per Test Breakdown

#### Example: IQ Test

- **Question 1**: If 5 machines produce 5 items in 5 minutes, how many machines are needed to produce 100 items in 100 minutes?
  - **Candidate Answer**: "10 machines"
  - **Correct Answer**: "5 machines"
  - **Score**: 0/10
  - **Analysis**: Candidate miscalculated linear scaling.
- **Question 2**: ...
  - **Candidate Answer**: ...
  - **Score**: ...
  - **Strengths**: Strong in pattern recognition.
  - **Weaknesses**: Needs improvement in applied math.
- **IQ Score**: 78/100

#### Example: Biometric Test

- **Question**: "How do you handle missing a sales target?"
  - **Candidate Answer**: "I don’t usually miss targets…"
  - **Model Answer**: Acknowledge failure, outline corrective action, and lessons learned.
  - **Content Score**: 60/100
  - **Behavioral Signals**:
    - Confidence: 55%
    - Stress: 70%
    - Eye Contact: Low
  - **Analysis**: Candidate avoided direct accountability; nervous tone detected.
- **Biometric Score**: 65/100

---

### Aggregate Dashboard

| Test Type        | Score | Key Strengths              | Key Weaknesses                 |
| ---------------- | ----- | -------------------------- | ------------------------------ |
| IQ               | 78    | Quick logical reasoning    | Weak math under time pressure  |
| Biometric        | 65    | Good focus                 | High stress levels             |
| Competency       | 82    | Strong technical knowledge | Needs more leadership examples |
| EQ               | 70    | Shows empathy              | Weak in conflict resolution    |
| SJT              | 75    | Reasonable judgment        | Overthinks simple cases        |
| Psychometric     | 68    | Organized, conscientious   | Low adaptability               |
| Technical Skills | 85    | Excellent coding skills    | Needs optimization knowledge   |
| Language         | 80    | Strong vocabulary          | Weak in business writing       |

---

### Final Recommendation

- **Overall Score**: 74/100
- **Strengths**: Analytical thinker, focused, technically solid.
- **Weaknesses**: Shows stress under pressure, avoids discussing failures.
- **Recommendation**: Proceed to next interview round.
- **Suggested Development Areas**: Stress management, negotiation skills.
