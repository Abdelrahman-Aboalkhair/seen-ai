import Stripe from 'stripe';
import { baseConfig } from '@/config/index.js';
import logger, { logError, logExternalAPI } from '@/lib/logger.js';
import type { ServiceConfig } from '@/types/common.types.js';

export abstract class BasePaymentService {
  protected stripe: Stripe;
  protected webhookSecret: string;
  protected serviceConfig: ServiceConfig;

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

  // Retry logic for Stripe API calls
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
        logExternalAPI('stripe', operationName, duration, true, { attempt });
        return result;
      } catch (error: any) {
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
        
        // Don't retry on client errors (4xx)
        if (error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }
        
        // Exponential backoff
        const delay = this.serviceConfig.backoffDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`Failed after ${retries} attempts`);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.stripe.accounts.retrieve();
      return true;
    } catch (error) {
      logError(error as Error, { operation: 'stripe_health_check' });
      return false;
    }
  }

  // Get Stripe instance for direct access
  protected getStripeInstance(): Stripe {
    return this.stripe;
  }
}
