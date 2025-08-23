import { BasePaymentService } from './base-payment.service.js';
import type { WebhookEvent } from '@/types/payment.types.js';
export declare class WebhookHandlerService extends BasePaymentService {
    private creditService;
    constructor();
    handleWebhook(rawBody: string, signature: string): Promise<WebhookEvent | null>;
    private processWebhookEvent;
    private handlePaymentIntentSucceeded;
    private handlePaymentIntentFailed;
    private handlePaymentIntentCanceled;
    private handleInvoicePaymentSucceeded;
    private handleInvoicePaymentFailed;
    private handleSubscriptionCreated;
    private handleSubscriptionUpdated;
    private handleSubscriptionDeleted;
    private handleCustomerCreated;
    private handleCustomerUpdated;
    private handlePaymentMethodAttached;
    private processSubscriptionCredits;
    private processSubscriptionActivation;
    private processSubscriptionCancellation;
}
//# sourceMappingURL=webhook-handler.service.d.ts.map