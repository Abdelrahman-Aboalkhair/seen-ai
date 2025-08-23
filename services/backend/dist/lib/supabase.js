import { createClient } from "@supabase/supabase-js";
import { baseConfig } from "@/config/index.js";
import logger, { logError } from "@/lib/logger.js";
class SupabaseService {
    client;
    adminClient;
    constructor() {
        this.client = createClient(baseConfig.supabase.url, baseConfig.supabase.anonKey);
        this.adminClient = createClient(baseConfig.supabase.url, baseConfig.supabase.serviceRoleKey);
        logger.info("Supabase clients initialized");
    }
    getClient() {
        return this.client;
    }
    getAdminClient() {
        return this.adminClient;
    }
    async verifyToken(token) {
        try {
            const { data, error } = await this.client.auth.getUser(token);
            if (error) {
                logError(error, { operation: "verify_token" });
                return { user: null, error };
            }
            return { user: data.user, error: null };
        }
        catch (error) {
            logError(error, { operation: "verify_token" });
            return { user: null, error };
        }
    }
    async getUser(userId) {
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
        }
        catch (error) {
            logError(error, { operation: "get_user", userId });
            return { data: null, error };
        }
    }
    async updateUserCredits(userId, credits) {
        try {
            const { data, error } = await this.adminClient
                .from("users")
                .update({
                credits,
                updated_at: new Date().toISOString(),
            })
                .eq("id", userId)
                .select()
                .single();
            if (error) {
                logError(error, { operation: "update_user_credits", userId, credits });
                return { data: null, error };
            }
            return { data, error: null };
        }
        catch (error) {
            logError(error, {
                operation: "update_user_credits",
                userId,
                credits,
            });
            return { data: null, error };
        }
    }
    async createCreditTransaction(userId, amount, type, description) {
        try {
            const { data, error } = await this.adminClient
                .from("credit_transactions")
                .insert({
                user_id: userId,
                amount,
                type,
                description,
                created_at: new Date().toISOString(),
            })
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
        }
        catch (error) {
            logError(error, {
                operation: "create_credit_transaction",
                userId,
                amount,
                type,
            });
            return { data: null, error };
        }
    }
    async createCandidate(candidateData) {
        try {
            const { data, error } = await this.adminClient
                .from("candidates")
                .insert({
                ...candidateData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
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
        }
        catch (error) {
            logError(error, {
                operation: "create_candidate",
                userId: candidateData.user_id,
            });
            return { data: null, error };
        }
    }
    async updateCandidate(candidateId, updates) {
        try {
            const { data, error } = await this.adminClient
                .from("candidates")
                .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
                .eq("id", candidateId)
                .select()
                .single();
            if (error) {
                logError(error, { operation: "update_candidate", candidateId });
                return { data: null, error };
            }
            return { data, error: null };
        }
        catch (error) {
            logError(error, { operation: "update_candidate", candidateId });
            return { data: null, error };
        }
    }
    async getCandidates(userId, limit = 50, offset = 0) {
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
        }
        catch (error) {
            logError(error, { operation: "get_candidates", userId });
            return { data: null, error };
        }
    }
    async createInterview(interviewData) {
        try {
            const { data, error } = await this.adminClient
                .from("interviews")
                .insert({
                ...interviewData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
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
        }
        catch (error) {
            logError(error, {
                operation: "create_interview",
                userId: interviewData.user_id,
            });
            return { data: null, error };
        }
    }
    async updateInterview(interviewId, updates) {
        try {
            const { data, error } = await this.adminClient
                .from("interviews")
                .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
                .eq("id", interviewId)
                .select()
                .single();
            if (error) {
                logError(error, { operation: "update_interview", interviewId });
                return { data: null, error };
            }
            return { data, error: null };
        }
        catch (error) {
            logError(error, { operation: "update_interview", interviewId });
            return { data: null, error };
        }
    }
    async getInterview(interviewId) {
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
        }
        catch (error) {
            logError(error, { operation: "get_interview", interviewId });
            return { data: null, error };
        }
    }
    async healthCheck() {
        try {
            const { data, error } = await this.adminClient
                .from("users")
                .select("id")
                .limit(1);
            return !error;
        }
        catch (error) {
            logError(error, { operation: "supabase_health_check" });
            return false;
        }
    }
}
const supabaseService = new SupabaseService();
export default supabaseService;
//# sourceMappingURL=supabase.js.map