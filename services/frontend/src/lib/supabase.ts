import { createClient } from "@supabase/supabase-js";
import { config, validateConfig } from "./config";

// Validate configuration on import
validateConfig();

// Create Supabase client using centralized config
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

// Database Types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  credits: number;
  total_searches: number;
  total_analyses: number;
  is_admin: boolean;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: "purchase" | "spend" | "bonus" | "referral";
  credits_amount: number;
  description?: string;
  order_id?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
}

export interface TalentSearch {
  id: string;
  user_id: string;
  search_query: any;
  required_skills: string[];
  certifications?: string[];
  education_level?: string;
  languages?: string[];
  candidate_count: number;
  match_threshold: number;
  credits_cost: number;
  status: "pending" | "processing" | "completed" | "failed";
  results?: any;
  created_at: string;
}

export interface CVAnalysis {
  id: string;
  user_id: string;
  job_title: string;
  job_description?: string;
  required_skills?: string[];
  file_count: number;
  credits_cost: number;
  status: "pending" | "processing" | "completed" | "failed";
  results?: any;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id?: string;
  referral_code: string;
  referee_email?: string;
  status: "pending" | "completed" | "expired";
  credits_awarded: number;
  created_at: string;
  completed_at?: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_sar: number;
  discount_percentage: number;
  is_active: boolean;
  description?: string;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  admin_reply?: string;
  created_at: string;
  updated_at: string;
}

// Candidate interface for search results
export interface Candidate {
  current_position: string;
  full_name: string;
  linkedin_url: string;
  contact: {
    phone: string;
    email: string;
  };
  match_score: number;
  skills_match: string;
  experience_match: string;
  summary: string;
  ranking: number;
  education_match: string;
  culture_fit: string;
  strengths: string;
  gaps: string;
}
