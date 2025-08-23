import OpenAI from "openai";
import { baseConfig } from "@/config/index.js";
import logger, { logError, logExternalAPI } from "@/lib/logger.js";
import type { ServiceConfig } from "@/types/common.types.js";

export abstract class BaseAIService {
  protected client: OpenAI;
  protected serviceConfig: ServiceConfig;

  constructor() {
    this.client = new OpenAI({
      apiKey: baseConfig.openai.apiKey,
      baseURL: baseConfig.openai.baseUrl,
    });

    this.serviceConfig = {
      retries: 3,
      timeout: 30000,
      backoffDelay: 1000,
    };

    logger.info("BaseAI service initialized");
  }

  // Retry logic for API calls
  protected async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries = this.serviceConfig.retries
  ): Promise<T> {
    const startTime = Date.now();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await operation();
        const duration = Date.now() - startTime;
        logExternalAPI("openai", operationName, duration, true, { attempt });
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logExternalAPI("openai", operationName, duration, false, {
          attempt,
          error: (error as Error).message,
        });

        if (attempt === retries) {
          logError(error as Error, {
            operation: operationName,
            attempts: retries,
          });
          throw error;
        }

        // Exponential backoff
        const delay =
          this.serviceConfig.backoffDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Failed after ${retries} attempts`);
  }

  // Generate completion with standard parameters
  protected async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    } = {}
  ): Promise<string> {
    const {
      temperature = 0.3,
      maxTokens = 2000,
      model = baseConfig.openai.model,
    } = options;

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return content;
  }

  // Parse JSON response with error handling
  protected parseJsonResponse<T>(content: string, operation: string): T {
    try {
      // Clean the content - remove markdown code blocks if present
      let cleanContent = content.trim();

      // Remove markdown code blocks (```json ... ```)
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      // Remove any leading/trailing whitespace
      cleanContent = cleanContent.trim();

      return JSON.parse(cleanContent) as T;
    } catch (parseError) {
      logError(parseError as Error, {
        operation: `parse_${operation}`,
        content,
        cleanedContent: content
          .trim()
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, ""),
      });
      throw new Error(`Failed to parse ${operation} response`);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: baseConfig.openai.model,
        messages: [
          {
            role: "user",
            content: 'Respond with "OK" if you can process this request.',
          },
        ],
        max_tokens: 10,
        temperature: 0,
      });

      return response.choices[0]?.message?.content?.includes("OK") || false;
    } catch (error) {
      logError(error as Error, { operation: "openai_health_check" });
      return false;
    }
  }
}
