// Supabase Configuration Service

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export class SupabaseConfig {
  private static instance: SupabaseConfig;
  private supabase: SupabaseClient;

  private constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🗄️ [Supabase] Configuration initialized:", {
      url: supabaseUrl,
      hasKey: !!supabaseKey,
    });
  }

  public static getInstance(): SupabaseConfig {
    if (!SupabaseConfig.instance) {
      SupabaseConfig.instance = new SupabaseConfig();
    }
    return SupabaseConfig.instance;
  }

  public getClient(): SupabaseClient {
    return this.supabase;
  }

  public isConfigured(): boolean {
    return !!(
      process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
}

export default SupabaseConfig.getInstance();
