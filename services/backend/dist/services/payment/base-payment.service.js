import Stripe from 'stripe';
import { baseConfig } from '@/config/index.js';
import logger, { logError, logExternalAPI } from '@/lib/logger.js';
export class BasePaymentService {
    stripe;
    webhookSecret;
    serviceConfig;
    constructor() {
        this.stripe = new Stripe(baseConfig.stripe.secretKey, {
            apiVersion: '2024-11-20.acacia',
            typescript: true,
        });
        this.webhookSecret = baseConfig.stripe.webhookSecret;
        this.serviceConfig = {
            retries: 3,
            timeout: 30000,
            backoffDelay: 1000,
        };
        logger.info('Base Payment service initialized');
    }
    async withRetry(operation, operationName, retries = this.serviceConfig.retries) {
        const startTime = Date.now();
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const result = await operation();
                const duration = Date.now() - startTime;
                logExternalAPI('stripe', operationName, duration, true, { attempt });
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logExternalAPI('stripe', operationName, duration, false, {
                    attempt,
                    error: error.message,
                    status: error.statusCode,
                });
                if (attempt === retries) {
                    logError(error, { operation: operationName, attempts: retries });
                    throw error;
                }
                if (error.statusCode >= 400 && error.statusCode < 500) {
                    throw error;
                }
                const delay = this.serviceConfig.backoffDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error(`Failed after ${retries} attempts`);
    }
    async healthCheck() {
        try {
            await this.stripe.accounts.retrieve();
            return true;
        }
        catch (error) {
            logError(error, { operation: 'stripe_health_check' });
            return false;
        }
    }
    getStripeInstance() {
        return this.stripe;
    }
}
//# sourceMappingURL=base-payment.service.js.map