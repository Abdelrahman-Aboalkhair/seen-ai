// Shared configuration utility for Supabase Edge Functions
export interface EdgeFunctionConfig {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  external: {
    openai: {
      apiKey: string;
      baseUrl: string;
    };
    stripe: {
      secretKey: string;
      baseUrl: string;
    };
    n8n: {
      webhookUrl: string;
    };
  };
  environment: {
    isDevelopment: boolean;
    isProduction: boolean;
  };
}

export function getConfig(): EdgeFunctionConfig {
  // Get environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openaiApiKey = Deno.env.get("OPENAI_API");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");

  // Optional: Override default API URLs
  const openaiBaseUrl =
    Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1";
  const stripeBaseUrl =
    Deno.env.get("STRIPE_BASE_URL") || "https://api.stripe.com/v1";

  // Environment detection
  const isDevelopment = Deno.env.get("ENVIRONMENT") === "development";
  const isProduction =
    Deno.env.get("ENVIRONMENT") === "production" || !isDevelopment;

  // Validate required environment variables
  if (!supabaseUrl) {
    throw new Error("Missing required environment variable: SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  // Log configuration in development
  if (isDevelopment) {
    console.log("Edge Function Configuration:", {
      supabaseUrl: supabaseUrl ? "configured" : "missing",
      serviceRoleKey: serviceRoleKey ? "configured" : "missing",
      openaiApiKey: openaiApiKey ? "configured" : "missing",
      stripeSecretKey: stripeSecretKey ? "configured" : "missing",
      n8nWebhookUrl: n8nWebhookUrl ? "configured" : "missing",
      environment: isDevelopment ? "development" : "production",
    });
  }

  return {
    supabase: {
      url: supabaseUrl,
      serviceRoleKey,
    },
    external: {
      openai: {
        apiKey: openaiApiKey || "",
        baseUrl: openaiBaseUrl,
      },
      stripe: {
        secretKey: stripeSecretKey || "",
        baseUrl: stripeBaseUrl,
      },
      n8n: {
        webhookUrl: n8nWebhookUrl || "",
      },
    },
    environment: {
      isDevelopment,
      isProduction,
    },
  };
}

// Utility functions for common operations
export function validateOpenAIConfig(): void {
  const config = getConfig();
  if (!config.external.openai.apiKey) {
    throw new Error(
      "OpenAI API key not configured. Set OPENAI_API environment variable."
    );
  }
}

export function validateStripeConfig(): void {
  const config = getConfig();
  if (!config.external.stripe.secretKey) {
    throw new Error(
      "Stripe secret key not configured. Set STRIPE_SECRET_KEY environment variable."
    );
  }
}

export function validateN8NConfig(): void {
  const config = getConfig();
  if (!config.external.n8n.webhookUrl) {
    throw new Error(
      "N8N webhook URL not configured. Set N8N_WEBHOOK_URL environment variable."
    );
  }
}

// CORS headers utility
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "false",
};

// Error response utility
export function createErrorResponse(error: Error, status: number = 500) {
  return new Response(
    JSON.stringify({
      error: {
        message: error.message,
        code: error.name,
      },
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// Success response utility
export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
