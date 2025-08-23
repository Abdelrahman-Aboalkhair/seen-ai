import OpenAI from "openai";
import { baseConfig } from "@/config/index.js";
import logger, { logError, logExternalAPI } from "@/lib/logger.js";
export class BaseAIService {
    client;
    serviceConfig;
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
    async withRetry(operation, operationName, retries = this.serviceConfig.retries) {
        const startTime = Date.now();
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const result = await operation();
                const duration = Date.now() - startTime;
                logExternalAPI("openai", operationName, duration, true, { attempt });
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logExternalAPI("openai", operationName, duration, false, {
                    attempt,
                    error: error.message,
                });
                if (attempt === retries) {
                    logError(error, {
                        operation: operationName,
                        attempts: retries,
                    });
                    throw error;
                }
                const delay = this.serviceConfig.backoffDelay * Math.pow(2, attempt - 1);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw new Error(`Failed after ${retries} attempts`);
    }
    async generateCompletion(systemPrompt, userPrompt, options = {}) {
        const { temperature = 0.3, maxTokens = 2000, model = baseConfig.openai.model, } = options;
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
    parseJsonResponse(content, operation) {
        try {
            return JSON.parse(content);
        }
        catch (parseError) {
            logError(parseError, {
                operation: `parse_${operation}`,
                content,
            });
            throw new Error(`Failed to parse ${operation} response`);
        }
    }
    async healthCheck() {
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
        }
        catch (error) {
            logError(error, { operation: "openai_health_check" });
            return false;
        }
    }
}
//# sourceMappingURL=base-ai.service.js.map