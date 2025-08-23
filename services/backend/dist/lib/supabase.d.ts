import { SupabaseClient } from "@supabase/supabase-js";
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
declare class SupabaseService {
    private client;
    private adminClient;
    constructor();
    getClient(): SupabaseClient<Database>;
    getAdminClient(): SupabaseClient<Database>;
    verifyToken(token: string): Promise<{
        user: any;
        error: any;
    }>;
    getUser(userId: string): Promise<{
        data: Database["public"]["Tables"]["users"]["Row"] | null;
        error: any;
    }>;
    updateUserCredits(userId: string, credits: number): Promise<{
        data: null;
        error: unknown;
    }>;
    createCreditTransaction(userId: string, amount: number, type: string, description: string): Promise<{
        data: null;
        error: unknown;
    }>;
    createCandidate(candidateData: Database["public"]["Tables"]["candidates"]["Insert"]): Promise<{
        data: null;
        error: unknown;
    }>;
    updateCandidate(candidateId: string, updates: Database["public"]["Tables"]["candidates"]["Update"]): Promise<{
        data: null;
        error: unknown;
    }>;
    getCandidates(userId: string, limit?: number, offset?: number): Promise<{
        data: never[];
        error: null;
    } | {
        data: null;
        error: unknown;
    }>;
    createInterview(interviewData: Database["public"]["Tables"]["interviews"]["Insert"]): Promise<{
        data: null;
        error: unknown;
    }>;
    updateInterview(interviewId: string, updates: Database["public"]["Tables"]["interviews"]["Update"]): Promise<{
        data: null;
        error: unknown;
    }>;
    getInterview(interviewId: string): Promise<{
        data: null;
        error: unknown;
    }>;
    healthCheck(): Promise<boolean>;
}
declare const supabaseService: SupabaseService;
export default supabaseService;
//# sourceMappingURL=supabase.d.ts.map