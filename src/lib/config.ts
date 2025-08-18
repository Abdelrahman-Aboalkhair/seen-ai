// Environment configuration utility
export interface AppConfig {
  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;

  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;

  // App
  appUrl: string;

  // External APIs
  openaiApiKey?: string;
  stripePublishableKey?: string;

  // App Info
  appName: string;
  appVersion: string;
}

// Get environment variables with validation
const getRequiredEnvVar = (name: string): string => {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getOptionalEnvVar = (name: string): string | undefined => {
  return import.meta.env[name];
};

// Create configuration object
export const config: AppConfig = {
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTest: import.meta.env.MODE === "test",

  // Supabase (required)
  supabaseUrl: getRequiredEnvVar("VITE_SUPABASE_URL"),
  supabaseAnonKey: getRequiredEnvVar("VITE_SUPABASE_ANON_KEY"),

  // App (with defaults)
  appUrl:
    getOptionalEnvVar("VITE_APP_URL") ||
    (import.meta.env.DEV
      ? "http://localhost:5173"
      : "https://smart-recruiter-beta.vercel.app"),

  // External APIs (optional)
  openaiApiKey: getOptionalEnvVar("VITE_OPENAI_API_KEY"),
  stripePublishableKey: getOptionalEnvVar("VITE_STRIPE_PUBLISHABLE_KEY"),

  // App Info
  appName: getOptionalEnvVar("VITE_APP_NAME") || "Smart Recruiter",
  appVersion: getOptionalEnvVar("VITE_APP_VERSION") || "1.0.0",
};

// Validation function
export const validateConfig = (): void => {
  const requiredFields: (keyof AppConfig)[] = [
    "supabaseUrl",
    "supabaseAnonKey",
  ];

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required configuration: ${field}`);
    }
  }

  if (config.isDevelopment) {
    console.log("App Configuration:", {
      mode: import.meta.env.MODE,
      isDevelopment: config.isDevelopment,
      isProduction: config.isProduction,
      supabaseUrl: config.supabaseUrl ? "configured" : "missing",
      supabaseAnonKey: config.supabaseAnonKey ? "configured" : "missing",
      appUrl: config.appUrl,
    });
  }
};

// Export default config
export default config;
