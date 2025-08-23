import { BasePaymentService } from './base-payment.service.js';
import type { SubscriptionRequest } from '@/types/payment.types.js';
export declare class SubscriptionService extends BasePaymentService {
    private customerService;
    constructor();
    createSubscription(request: SubscriptionRequest): Promise<any>;
    getSubscription(subscriptionId: string): Promise<any>;
    updateSubscription(subscriptionId: string, updates: any): Promise<any>;
    cancelSubscription(subscriptionId: string): Promise<any>;
    listSubscriptions(options?: {
        limit?: number;
        startingAfter?: string;
        endingBefore?: string;
        status?: string;
        price?: string;
    }): Promise<any>;
    listCustomerSubscriptions(customerId: string): Promise<any>;
    pauseSubscription(subscriptionId: string): Promise<any>;
    resumeSubscription(subscriptionId: string): Promise<any>;
    changeSubscriptionPlan(subscriptionId: string, newPriceId: string): Promise<any>;
    addSubscriptionItem(subscriptionId: string, priceId: string, quantity?: number): Promise<any>;
    removeSubscriptionItem(subscriptionItemId: string): Promise<any>;
    getSubscriptionUsage(subscriptionItemId: string, options?: {
        limit?: number;
        startingAfter?: string;
        endingBefore?: string;
    }): Promise<any>;
    createUsageRecord(subscriptionItemId: string, quantity: number, timestamp?: number): Promise<any>;
    getUpcomingInvoice(customerId: string, subscriptionId?: string): Promise<any>;
    previewSubscriptionChanges(subscriptionId: string, changes: any): Promise<any>;
}
//# sourceMappingURL=subscription.service.d.ts.map