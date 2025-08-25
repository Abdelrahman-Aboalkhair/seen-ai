// CV Analysis Database Service - Handles Supabase operations

import supabaseConfig from "@/config/supabase.config.js";
import type { CVAnalysisResult } from "@/types/ai.types.js";

export interface CVAnalysisDBRecord {
  id?: string;
  user_id: string;
  job_title: string;
  job_description: string;
  required_skills?: string[];
  file_count?: number;
  results: CVAnalysisResult;
  credits_cost?: number;
  status: "processing" | "completed" | "failed";
  created_at?: string;
  updated_at?: string;
}

export interface CVAnalysisHistoryQuery {
  userId: string;
  limit?: number;
  offset?: number;
  status?: "completed" | "failed" | "processing";
}

export class CVAnalysisDBService {
  private supabase = supabaseConfig.getClient();
  private readonly tableName = "cv_analyses";

  constructor() {
    if (!supabaseConfig.isConfigured()) {
      console.warn(
        "⚠️ [CV DB Service] Supabase configuration incomplete. Database operations may fail."
      );
    }
  }

  /**
   * Save CV analysis result to database
   */
  async saveAnalysisResult(
    userId: string,
    jobTitle: string,
    jobDescription: string,
    requiredSkills: string[],
    fileCount: number,
    analysisResult: CVAnalysisResult,
    creditsCost: number = 5
  ): Promise<string> {
    try {
      console.log("💾 [CV DB Service] Saving analysis result to database:", {
        userId,
        jobTitle,
        jobDescriptionLength: jobDescription.length,
        requiredSkillsCount: requiredSkills.length,
        fileCount,
        resultScore: analysisResult.score,
        resultMatchPercentage: analysisResult.matchPercentage,
        creditsCost,
      });

      const record: Omit<
        CVAnalysisDBRecord,
        "id" | "created_at" | "updated_at"
      > = {
        user_id: userId,
        job_title: jobTitle,
        job_description: jobDescription,
        required_skills: requiredSkills,
        file_count: fileCount,
        results: analysisResult,
        credits_cost: creditsCost,
        status: "completed",
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(record)
        .select("id")
        .single();

      if (error) {
        console.error(
          "❌ [CV DB Service] Failed to save analysis result:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("✅ [CV DB Service] Analysis result saved successfully:", {
        recordId: data.id,
        userId,
      });

      return data.id;
    } catch (error) {
      console.error("❌ [CV DB Service] Error saving analysis result:", error);
      throw error;
    }
  }

  /**
   * Get CV analysis history for a user
   */
  async getAnalysisHistory(
    query: CVAnalysisHistoryQuery
  ): Promise<CVAnalysisDBRecord[]> {
    try {
      console.log("📚 [CV DB Service] Fetching analysis history:", {
        userId: query.userId,
        limit: query.limit,
        offset: query.offset,
        status: query.status,
      });

      let supabaseQuery = this.supabase
        .from(this.tableName)
        .select("*")
        .eq("user_id", query.userId)
        .order("created_at", { ascending: false });

      if (query.status) {
        supabaseQuery = supabaseQuery.eq("status", query.status);
      }

      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(
          query.offset,
          query.offset + (query.limit || 10) - 1
        );
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error(
          "❌ [CV DB Service] Failed to fetch analysis history:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("✅ [CV DB Service] Analysis history fetched successfully:", {
        userId: query.userId,
        recordCount: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      console.error(
        "❌ [CV DB Service] Error fetching analysis history:",
        error
      );
      throw error;
    }
  }

  /**
   * Get a specific CV analysis by ID
   */
  async getAnalysisById(
    analysisId: string
  ): Promise<CVAnalysisDBRecord | null> {
    try {
      console.log("🔍 [CV DB Service] Fetching analysis by ID:", analysisId);

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("id", analysisId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          console.log(
            "ℹ️ [CV DB Service] No analysis found with ID:",
            analysisId
          );
          return null;
        }
        console.error(
          "❌ [CV DB Service] Failed to fetch analysis by ID:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("✅ [CV DB Service] Analysis fetched successfully:", {
        analysisId,
        userId: data.user_id,
        status: data.status,
      });

      return data;
    } catch (error) {
      console.error("❌ [CV DB Service] Error fetching analysis by ID:", error);
      throw error;
    }
  }

  /**
   * Update analysis status
   */
  async updateAnalysisStatus(
    analysisId: string,
    status: "completed" | "failed" | "processing"
  ): Promise<void> {
    try {
      console.log("🔄 [CV DB Service] Updating analysis status:", {
        analysisId,
        status,
      });

      const { error } = await this.supabase
        .from(this.tableName)
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysisId);

      if (error) {
        console.error(
          "❌ [CV DB Service] Failed to update analysis status:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("✅ [CV DB Service] Analysis status updated successfully:", {
        analysisId,
        status,
      });
    } catch (error) {
      console.error(
        "❌ [CV DB Service] Error updating analysis status:",
        error
      );
      throw error;
    }
  }

  /**
   * Delete CV analysis record
   */
  async deleteAnalysis(analysisId: string): Promise<void> {
    try {
      console.log("🗑️ [CV DB Service] Deleting analysis record:", analysisId);

      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq("id", analysisId);

      if (error) {
        console.error("❌ [CV DB Service] Failed to delete analysis:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(
        "✅ [CV DB Service] Analysis deleted successfully:",
        analysisId
      );
    } catch (error) {
      console.error("❌ [CV DB Service] Error deleting analysis:", error);
      throw error;
    }
  }

  /**
   * Get analysis statistics for a user
   */
  async getAnalysisStats(userId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    processing: number;
    averageScore: number;
    averageProcessingTime: number;
  }> {
    try {
      console.log(
        "📊 [CV DB Service] Fetching analysis statistics for user:",
        userId
      );

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("status, results, credits_cost")
        .eq("user_id", userId);

      if (error) {
        console.error(
          "❌ [CV DB Service] Failed to fetch analysis statistics:",
          error
        );
        throw new Error(`Database error: ${error.message}`);
      }

      const stats = {
        total: data?.length || 0,
        completed: 0,
        failed: 0,
        processing: 0,
        averageScore: 0,
        averageProcessingTime: 0,
      };

      let totalScore = 0;
      let totalProcessingTime = 0;
      let completedCount = 0;

      data?.forEach((record) => {
        switch (record.status) {
          case "completed":
            stats.completed++;
            if (record.results?.score) {
              totalScore += record.results.score;
              completedCount++;
            }
            // Note: processing_time is not available in your schema
            break;
          case "failed":
            stats.failed++;
            break;
          case "processing":
            stats.processing++;
            break;
        }
      });

      if (completedCount > 0) {
        stats.averageScore = Math.round(totalScore / completedCount);
        stats.averageProcessingTime = Math.round(
          totalProcessingTime / completedCount
        );
      }

      console.log(
        "✅ [CV DB Service] Analysis statistics fetched successfully:",
        stats
      );

      return stats;
    } catch (error) {
      console.error(
        "❌ [CV DB Service] Error fetching analysis statistics:",
        error
      );
      throw error;
    }
  }
}
