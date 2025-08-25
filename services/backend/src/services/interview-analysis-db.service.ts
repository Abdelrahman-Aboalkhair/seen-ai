// Interview Analysis Database Service - Handles Supabase operations

import supabaseConfig from "@/config/supabase.config.js";
import type { InterviewAnalysisResult } from "@/types/ai.types.js";

export interface InterviewAnalysisDBRecord {
  id?: string;
  session_id: string;
  test_type: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  analysis_data: InterviewAnalysisResult;
  created_at?: string;
}

export interface InterviewAnalysisQuery {
  sessionId?: string;
  interviewId?: string;
  candidateId?: string;
  limit?: number;
  offset?: number;
}

export class InterviewAnalysisDBService {
  private supabase = supabaseConfig.getClient();
  private readonly tableName = "interview_analyses";

  constructor() {
    if (!supabaseConfig.isConfigured()) {
      console.warn(
        "⚠️ [Interview Analysis DB Service] Supabase configuration incomplete. Database operations may fail."
      );
    }
  }

  /**
   * Save interview analysis result to database
   */
  async saveAnalysisResult(
    sessionId: string,
    testType: string,
    analysisResult: InterviewAnalysisResult
  ): Promise<string> {
    try {
      console.log(
        "💾 [Interview Analysis DB Service] Saving analysis result to database:",
        {
          sessionId,
          testType,
          overallScore: analysisResult.overallScore,
          questionScoresCount: analysisResult.questionScores?.length || 0,
        }
      );

      const record: Omit<InterviewAnalysisDBRecord, "id" | "created_at"> = {
        session_id: sessionId,
        test_type: testType,
        score: analysisResult.overallScore,
        strengths: analysisResult.strengths || [],
        weaknesses: analysisResult.weaknesses || [],
        analysis_data: analysisResult,
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(record)
        .select("id")
        .single();

      if (error) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to save analysis result:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(
        "✅ [Interview Analysis DB Service] Analysis result saved successfully:",
        {
          recordId: data.id,
          sessionId,
          testType,
        }
      );

      return data.id;
    } catch (error) {
      console.error(
        "❌ [Interview Analysis DB Service] Error saving analysis result:",
        error
      );
      throw error;
    }
  }

  /**
   * Get interview analysis by session ID
   */
  async getAnalysisBySessionId(
    sessionId: string
  ): Promise<InterviewAnalysisDBRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to get analysis by session ID:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error(
        "❌ [Interview Analysis DB Service] Error getting analysis by session ID:",
        error
      );
      throw error;
    }
  }

  /**
   * Get interview analysis by interview ID (through sessions)
   */
  async getAnalysisByInterviewId(
    interviewId: string
  ): Promise<InterviewAnalysisDBRecord[]> {
    try {
      // First get all sessions for this interview
      const { data: sessions, error: sessionsError } = await this.supabase
        .from("interview_sessions")
        .select("id")
        .eq("interview_id", interviewId);

      if (sessionsError) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to get sessions for interview:",
          sessionsError
        );
        throw new Error(`Database error: ${sessionsError.message}`);
      }

      if (!sessions || sessions.length === 0) {
        return [];
      }

      const sessionIds = sessions.map((s) => s.id);

      // Get all analyses for these sessions
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to get analysis by interview ID:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error(
        "❌ [Interview Analysis DB Service] Error getting analysis by interview ID:",
        error
      );
      throw error;
    }
  }

  /**
   * Get interview analysis by candidate ID (through sessions)
   */
  async getAnalysisByCandidateId(
    candidateId: string
  ): Promise<InterviewAnalysisDBRecord[]> {
    try {
      // First get all sessions for this candidate
      const { data: sessions, error: sessionsError } = await this.supabase
        .from("interview_sessions")
        .select("id")
        .eq("candidate_id", candidateId);

      if (sessionsError) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to get sessions for candidate:",
          sessionsError
        );
        throw new Error(`Database error: ${sessionsError.message}`);
      }

      if (!sessions || sessions.length === 0) {
        return [];
      }

      const sessionIds = sessions.map((s) => s.id);

      // Get all analyses for these sessions
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to get analysis by candidate ID:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error(
        "❌ [Interview Analysis DB Service] Error getting analysis by candidate ID:",
        error
      );
      throw error;
    }
  }

  /**
   * Get interview analysis history with pagination
   */
  async getAnalysisHistory(
    query: InterviewAnalysisQuery
  ): Promise<InterviewAnalysisDBRecord[]> {
    try {
      let queryBuilder = this.supabase
        .from(this.tableName)
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (query.sessionId) {
        queryBuilder = queryBuilder.eq("session_id", query.sessionId);
      }

      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      if (query.offset) {
        queryBuilder = queryBuilder.range(
          query.offset,
          query.offset + (query.limit || 10) - 1
        );
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to get analysis history:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error(
        "❌ [Interview Analysis DB Service] Error getting analysis history:",
        error
      );
      throw error;
    }
  }

  /**
   * Update interview session status to completed
   */
  async markSessionCompleted(sessionId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("interview_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to mark session completed:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(
        "✅ [Interview Analysis DB Service] Session marked as completed:",
        sessionId
      );
    } catch (error) {
      console.error(
        "❌ [Interview Analysis DB Service] Error marking session completed:",
        error
      );
      throw error;
    }
  }

  /**
   * Get session details for analysis
   */
  async getSessionDetails(sessionId: string): Promise<{
    session: any;
    interview: any;
    candidate: any;
    questions: any[];
    answers: any[];
  } | null> {
    try {
      // Get session with interview and candidate details
      const { data: session, error: sessionError } = await this.supabase
        .from("interview_sessions")
        .select(
          `
          *,
          interviews (*),
          interview_candidates (*)
        `
        )
        .eq("id", sessionId)
        .single();

      if (sessionError) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to get session details:",
          sessionError
        );
        throw new Error(`Database error: ${sessionError.message}`);
      }

      if (!session) {
        return null;
      }

      // Get questions for this interview
      const { data: questions, error: questionsError } = await this.supabase
        .from("interview_questions")
        .select("*")
        .eq("interview_id", session.interview_id)
        .order("question_order", { ascending: true });

      if (questionsError) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to get questions:",
          questionsError
        );
        throw new Error(`Database error: ${questionsError.message}`);
      }

      // Get answers for this session
      const { data: answers, error: answersError } = await this.supabase
        .from("interview_answers")
        .select("*")
        .eq("session_id", sessionId)
        .order("answered_at", { ascending: true });

      if (answersError) {
        console.error(
          "❌ [Interview Analysis DB Service] Failed to get answers:",
          answersError
        );
        throw new Error(`Database error: ${answersError.message}`);
      }

      return {
        session,
        interview: session.interviews,
        candidate: session.interview_candidates,
        questions: questions || [],
        answers: answers || [],
      };
    } catch (error) {
      console.error(
        "❌ [Interview Analysis DB Service] Error getting session details:",
        error
      );
      throw error;
    }
  }
}
