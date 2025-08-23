import OpenAI from "openai";
import type { ServiceConfig } from "@/types/common.types.js";
export declare abstract class BaseAIService {
    protected client: OpenAI;
    protected serviceConfig: ServiceConfig;
    constructor();
    protected withRetry<T>(operation: () => Promise<T>, operationName: string, retries?: number): Promise<T>;
    protected generateCompletion(systemPrompt: string, userPrompt: string, options?: {
        temperature?: number;
        maxTokens?: number;
        model?: string;
    }): Promise<string>;
    protected parseJsonResponse<T>(content: string, operation: string): T;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=base-ai.service.d.ts.map