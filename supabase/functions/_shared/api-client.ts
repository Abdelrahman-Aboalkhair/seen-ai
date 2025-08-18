// API client utilities for external services
import {
  getConfig,
  validateOpenAIConfig,
  validateStripeConfig,
  validateN8NConfig,
} from "./config.ts";

export class OpenAIClient {
  private config = getConfig();

  constructor() {
    validateOpenAIConfig();
  }

  async chatCompletions(payload: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
  }) {
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
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async models() {
    const response = await fetch(
      `${this.config.external.openai.baseUrl}/models`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.external.openai.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    return response.json();
  }
}

export class StripeClient {
  private config = getConfig();

  constructor() {
    validateStripeConfig();
  }

  async createCheckoutSession(params: URLSearchParams) {
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
      throw new Error(`Stripe API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async retrieveSession(sessionId: string) {
    const response = await fetch(
      `${this.config.external.stripe.baseUrl}/checkout/sessions/${sessionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.external.stripe.secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error (${response.status}): ${error}`);
    }

    return response.json();
  }
}

export class N8NClient {
  private config = getConfig();

  constructor() {
    validateN8NConfig();
  }

  async callWebhook(payload: any) {
    const response = await fetch(this.config.external.n8n.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`N8N webhook error (${response.status}): ${error}`);
    }

    return response.json();
  }
}

export class SupabaseClient {
  private config = getConfig();

  async getUser(authHeader: string) {
    const response = await fetch(`${this.config.supabase.url}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        apikey: this.config.supabase.serviceRoleKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase auth error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async getProfile(userId: string) {
    const response = await fetch(
      `${this.config.supabase.url}/rest/v1/profiles?select=*&id=eq.${userId}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.supabase.serviceRoleKey}`,
          apikey: this.config.supabase.serviceRoleKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase profile error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async updateProfile(userId: string, updates: any) {
    const response = await fetch(
      `${this.config.supabase.url}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.config.supabase.serviceRoleKey}`,
          apikey: this.config.supabase.serviceRoleKey,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase update error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async createRecord(table: string, data: any) {
    const response = await fetch(
      `${this.config.supabase.url}/rest/v1/${table}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.supabase.serviceRoleKey}`,
          apikey: this.config.supabase.serviceRoleKey,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase create error (${response.status}): ${error}`);
    }

    return response.json();
  }
}

// Export singleton instances
export const openaiClient = new OpenAIClient();
export const stripeClient = new StripeClient();
export const n8nClient = new N8NClient();
export const supabaseClient = new SupabaseClient();
