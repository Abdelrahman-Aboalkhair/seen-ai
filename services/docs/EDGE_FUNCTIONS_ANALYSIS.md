# Edge Functions Analysis - Hardcoded URLs and Environment Variables

## 🔍 Issues Found

### 1. **CV Analysis Function** (`supabase/functions/cv-analysis/index.ts`)

**Hardcoded URLs:**

- `https://api.openai.com/v1/chat/completions` (lines 142, 316, 426)
- `https://esm.sh/unpdf@0.11.0` (line 197)
- `https://deno.land/x/pdf_parser@v1.1.2/mod.ts` (line 231)

**Environment Variables Used:**

- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_URL`
- ✅ `OPENAI_API`

### 2. **Talent Search Function** (`supabase/functions/talent-search/index.ts`)

**Hardcoded URLs:**

- None found (uses environment variable `N8N_WEBHOOK_URL`)

**Environment Variables Used:**

- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_URL`
- ✅ `N8N_WEBHOOK_URL`

### 3. **Job Requirements Generator** (`supabase/functions/job-requirements-generator/index.ts`)

**Hardcoded URLs:**

- `https://api.openai.com/v1/chat/completions` (line 113)

**Environment Variables Used:**

- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_URL`
- ✅ `OPENAI_API`

### 4. **Process Payment Function** (`supabase/functions/process-payment/index.ts`)

**Hardcoded URLs:**

- `https://api.stripe.com/v1/checkout/sessions` (line 108)

**Environment Variables Used:**

- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_URL`
- ✅ `STRIPE_SECRET_KEY`

### 5. **Credits Functions** (`add-credits`, `deduct-credits`)

**Hardcoded URLs:**

- None found (only use Supabase URLs via environment variables)

**Environment Variables Used:**

- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_URL`

## 🚨 Critical Issues

### 1. **Hardcoded External API URLs**

- OpenAI API URLs are hardcoded in multiple functions
- Stripe API URL is hardcoded
- External library URLs are hardcoded

### 2. **Missing Environment Variable Validation**

- Some functions don't validate all required environment variables
- No fallback mechanisms for missing variables

### 3. **Inconsistent Error Handling**

- Different error handling patterns across functions
- Some functions don't provide helpful error messages

## 🛠️ Recommended Solutions

### 1. **Create Edge Function Configuration Utility**

Create a shared configuration file for all edge functions:

```typescript
// supabase/functions/_shared/config.ts
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
}

export function getConfig(): EdgeFunctionConfig {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openaiApiKey = Deno.env.get("OPENAI_API");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");

  // Validate required environment variables
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing required Supabase environment variables");
  }

  return {
    supabase: {
      url: supabaseUrl,
      serviceRoleKey,
    },
    external: {
      openai: {
        apiKey: openaiApiKey || "",
        baseUrl: "https://api.openai.com/v1",
      },
      stripe: {
        secretKey: stripeSecretKey || "",
        baseUrl: "https://api.stripe.com/v1",
      },
      n8n: {
        webhookUrl: n8nWebhookUrl || "",
      },
    },
  };
}
```

### 2. **Create API Client Utilities**

```typescript
// supabase/functions/_shared/api-client.ts
import { getConfig } from "./config.ts";

export class OpenAIClient {
  private config = getConfig();

  async chatCompletions(payload: any) {
    if (!this.config.external.openai.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await fetch(
      `${this.config.external.openai.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.external.openai.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    return response.json();
  }
}

export class StripeClient {
  private config = getConfig();

  async createCheckoutSession(params: URLSearchParams) {
    if (!this.config.external.stripe.secretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const response = await fetch(
      `${this.config.external.stripe.baseUrl}/checkout/sessions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.external.stripe.secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${error}`);
    }

    return response.json();
  }
}
```

### 3. **Environment Variable Documentation**

Create a comprehensive environment variable guide for edge functions:

```bash
# Required for all edge functions
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for CV Analysis and Job Requirements Generator
OPENAI_API=your-openai-api-key

# Required for Process Payment
STRIPE_SECRET_KEY=your-stripe-secret-key

# Required for Talent Search
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/endpoint

# Optional: Override default API URLs
OPENAI_BASE_URL=https://api.openai.com/v1
STRIPE_BASE_URL=https://api.stripe.com/v1
```

## 📋 Action Items

### High Priority

1. **Create shared configuration utility** for all edge functions
2. **Replace hardcoded OpenAI URLs** with configurable base URLs
3. **Replace hardcoded Stripe URL** with configurable base URL
4. **Add environment variable validation** to all functions

### Medium Priority

1. **Create API client utilities** for external services
2. **Standardize error handling** across all functions
3. **Add comprehensive logging** for debugging

### Low Priority

1. **Create environment variable templates** for different environments
2. **Add health check endpoints** for external services
3. **Implement retry logic** for external API calls

## 🔧 Implementation Steps

1. **Create shared utilities** in `supabase/functions/_shared/`
2. **Update each function** to use the shared configuration
3. **Test all functions** with the new configuration
4. **Update deployment documentation** with new environment variables
5. **Add environment variable validation** to deployment scripts

## 🎯 Benefits

- **No more hardcoded URLs** in edge functions
- **Centralized configuration** management
- **Better error handling** and debugging
- **Environment-specific** configurations
- **Easier maintenance** and updates
- **Consistent patterns** across all functions

---

**Next Steps:** Implement the shared configuration utility and update the edge functions to use it.
