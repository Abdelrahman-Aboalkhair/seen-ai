import { config } from "./config";

// API utility for handling dynamic URLs and environment-specific endpoints
export class ApiClient {
  // Build full URL for Supabase edge functions
  buildEdgeFunctionUrl(functionName: string): string {
    // Get the Supabase URL from config and construct edge function URL
    const supabaseUrl = config.supabaseUrl;
    return `${supabaseUrl}/functions/v1/${functionName}`;
  }

  // Get environment-specific API configuration
  getApiConfig() {
    return {
      supabaseUrl: config.supabaseUrl,
      isDevelopment: config.isDevelopment,
      isProduction: config.isProduction,
    };
  }
}

// Default API client instance
export const apiClient = new ApiClient();

// Utility functions for common API operations
export const apiUtils = {
  // Get the Supabase URL for the current environment
  getSupabaseUrl: (): string => {
    return config.supabaseUrl;
  },

  // Check if we're in development mode
  isDevelopment: (): boolean => {
    return config.isDevelopment;
  },

  // Check if we're in production mode
  isProduction: (): boolean => {
    return config.isProduction;
  },

  // Get the app URL for the current environment
  getAppUrl: (): string => {
    return config.appUrl;
  },

  // Build a full URL for external services
  buildExternalUrl: (service: string, endpoint: string): string => {
    const serviceUrls: Record<string, string> = {
      supabase: config.supabaseUrl,
      openai: "https://api.openai.com/v1",
      stripe: "https://api.stripe.com/v1",
    };

    const baseUrl = serviceUrls[service];
    if (!baseUrl) {
      throw new Error(`Unknown service: ${service}`);
    }

    return `${baseUrl}/${endpoint}`;
  },

  // Build edge function URLs
  buildEdgeFunctionUrl: (functionName: string): string => {
    return `${config.supabaseUrl}/functions/v1/${functionName}`;
  },
};

// Export default API client
export default apiClient;
