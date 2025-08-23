import Stripe from 'stripe';
import type { ServiceConfig } from '@/types/common.types.js';
export declare abstract class BasePaymentService {
    protected stripe: Stripe;
    protected webhookSecret: string;
    protected serviceConfig: ServiceConfig;
    constructor();
    protected withRetry<T>(operation: () => Promise<T>, operationName: string, retries?: number): Promise<T>;
    healthCheck(): Promise<boolean>;
    protected getStripeInstance(): Stripe;
}
//# sourceMappingURL=base-payment.service.d.ts.map