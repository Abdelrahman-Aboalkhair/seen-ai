import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { baseConfig } from "@/config/index.js";
import logger, { logError } from "@/lib/logger.js";

// Database types (you can generate these from Supabase CLI)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name?: string;
          credits: number;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string;
          credits?: number;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          credits?: number;
          role?: string;
          updated_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          cv_text: string;
          analysis_result: any;
          score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          cv_text: string;
          analysis_result?: any;
          score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          cv_text?: string;
          analysis_result?: any;
          score?: number;
          updated_at?: string;
        };
      };
      interviews: {
        Row: {
          id: string;
          user_id: string;
          candidate_id: string;
          questions: any[];
          answers: any[];
          analysis_result: any;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          candidate_id: string;
          questions?: any[];
          answers?: any[];
          analysis_result?: any;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          candidate_id?: string;
          questions?: any[];
          answers?: any[];
          analysis_result?: any;
          status?: string;
          updated_at?: string;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: string;
          description?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

class SupabaseService {
  private client: SupabaseClient<Database>;
  private adminClient: SupabaseClient<Database>;

  constructor() {
    // Regular client (uses anon key)
    this.client = createClient<Database>(
      baseConfig.supabase.url,
      baseConfig.supabase.anonKey
    );

    // Admin client (uses service role key)
    this.adminClient = createClient<Database>(
      baseConfig.supabase.url,
      baseConfig.supabase.serviceRoleKey
    );

    logger.info("Supabase clients initialized");
  }

  // Get client for user operations (requires auth)
  getClient(): SupabaseClient<Database> {
    return this.client;
  }

  // Get admin client for privileged operations
  getAdminClient(): SupabaseClient<Database> {
    return this.adminClient;
  }

  // Verify JWT token and get user
  async verifyToken(token: string): Promise<{ user: any; error: any }> {
    try {
      const { data, error } = await this.client.auth.getUser(token);

      if (error) {
        logError(error, { operation: "verify_token" });
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      logError(error as Error, { operation: "verify_token" });
      return { user: null, error };
    }
  }

  // User operations
  async getUser(userId: string): Promise<{
    data: Database["public"]["Tables"]["users"]["Row"] | null;
    error: any;
  }> {
    try {
      const { data, error } = await this.adminClient
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        logError(error, { operation: "get_user", userId });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logError(error as Error, { operation: "get_user", userId });
      return { data: null, error };
    }
  }

  async updateUserCredits(userId: string, credits: number) {
    try {
      const { data, error } = await this.adminClient
        .from("users")
        .update({
          credits,
          updated_at: new Date().toISOString(),
        } as Database["public"]["Tables"]["users"]["Update"])
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        logError(error, { operation: "update_user_credits", userId, credits });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logError(error as Error, {
        operation: "update_user_credits",
        userId,
        credits,
      });
      return { data: null, error };
    }
  }

  // Credit transaction operations
  async createCreditTransaction(
    userId: string,
    amount: number,
    type: string,
    description: string
  ) {
    try {
      const { data, error } = await this.adminClient
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount,
          type,
          description,
          created_at: new Date().toISOString(),
        } as Database["public"]["Tables"]["credit_transactions"]["Insert"])
        .select()
        .single();

      if (error) {
        logError(error, {
          operation: "create_credit_transaction",
          userId,
          amount,
          type,
        });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logError(error as Error, {
        operation: "create_credit_transaction",
        userId,
        amount,
        type,
      });
      return { data: null, error };
    }
  }

  // Candidate operations
  async createCandidate(
    candidateData: Database["public"]["Tables"]["candidates"]["Insert"]
  ) {
    try {
      const { data, error } = await this.adminClient
        .from("candidates")
        .insert({
          ...candidateData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Database["public"]["Tables"]["candidates"]["Insert"])
        .select()
        .single();

      if (error) {
        logError(error, {
          operation: "create_candidate",
          userId: candidateData.user_id,
        });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logError(error as Error, {
        operation: "create_candidate",
        userId: candidateData.user_id,
      });
      return { data: null, error };
    }
  }

  async updateCandidate(
    candidateId: string,
    updates: Database["public"]["Tables"]["candidates"]["Update"]
  ) {
    try {
      const { data, error } = await this.adminClient
        .from("candidates")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as Database["public"]["Tables"]["candidates"]["Update"])
        .eq("id", candidateId)
        .select()
        .single();

      if (error) {
        logError(error, { operation: "update_candidate", candidateId });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logError(error as Error, { operation: "update_candidate", candidateId });
      return { data: null, error };
    }
  }

  async getCandidates(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data, error } = await this.adminClient
        .from("candidates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logError(error, { operation: "get_candidates", userId });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logError(error as Error, { operation: "get_candidates", userId });
      return { data: null, error };
    }
  }

  // Interview operations
  async createInterview(
    interviewData: Database["public"]["Tables"]["interviews"]["Insert"]
  ) {
    try {
      const { data, error } = await this.adminClient
        .from("interviews")
        .insert({
          ...interviewData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Database["public"]["Tables"]["interviews"]["Insert"])
        .select()
        .single();

      if (error) {
        logError(error, {
          operation: "create_interview",
          userId: interviewData.user_id,
        });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logError(error as Error, {
        operation: "create_interview",
        userId: interviewData.user_id,
      });
      return { data: null, error };
    }
  }

  async updateInterview(
    interviewId: string,
    updates: Database["public"]["Tables"]["interviews"]["Update"]
  ) {
    try {
      const { data, error } = await this.adminClient
        .from("interviews")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as Database["public"]["Tables"]["interviews"]["Update"])
        .eq("id", interviewId)
        .select()
        .single();

      if (error) {
        logError(error, { operation: "update_interview", interviewId });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logError(error as Error, { operation: "update_interview", interviewId });
      return { data: null, error };
    }
  }

  async getInterview(interviewId: string) {
    try {
      const { data, error } = await this.adminClient
        .from("interviews")
        .select("*")
        .eq("id", interviewId)
        .single();

      if (error) {
        logError(error, { operation: "get_interview", interviewId });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logError(error as Error, { operation: "get_interview", interviewId });
      return { data: null, error };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.adminClient
        .from("users")
        .select("id")
        .limit(1);

      return !error;
    } catch (error) {
      logError(error as Error, { operation: "supabase_health_check" });
      return false;
    }
  }
}

// Create singleton instance
const supabaseService = new SupabaseService();

export default supabaseService;
