import Stripe from 'stripe';
export interface PaymentRequest {
    amount: number;
    currency: string;
    userId: string;
    description: string;
    credits: number;
    metadata?: Record<string, string>;
    paymentMethodId?: string;
    customerId?: string;
}
export interface PaymentResult {
    paymentIntentId: string;
    clientSecret?: string;
    status: string;
    amount: number;
    currency: string;
    credits: number;
    transactionId?: string;
}
export interface RefundRequest {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
    userId: string;
}
export interface RefundResult {
    refundId: string;
    status: string;
    amount: number;
    reason: string;
}
export interface CustomerData {
    userId: string;
    email: string;
    name?: string;
    metadata?: Record<string, string>;
}
export interface SubscriptionRequest {
    userId: string;
    priceId: string;
    customerId?: string;
    metadata?: Record<string, string>;
}
export interface WebhookEvent {
    id: string;
    type: string;
    data: any;
    created: number;
}
declare class StripeService {
    private stripe;
    private webhookSecret;
    constructor();
    processPayment(request: PaymentRequest): Promise<PaymentResult>;
    private handleSuccessfulPayment;
    processRefund(request: RefundRequest): Promise<RefundResult>;
    private handleRefundCredits;
    createOrGetCustomer(customerData: CustomerData): Promise<Stripe.Customer>;
    createSubscription(request: SubscriptionRequest): Promise<Stripe.Subscription>;
    cancelSubscription(subscriptionId: string, userId: string): Promise<Stripe.Subscription>;
    handleWebhook(rawBody: string, signature: string): Promise<WebhookEvent | null>;
    private processWebhookEvent;
    private handlePaymentIntentSucceeded;
    private handlePaymentIntentFailed;
    private handleInvoicePaymentSucceeded;
    private handleSubscriptionDeleted;
    private handleSubscriptionUpdated;
    getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    getCustomer(customerId: string): Promise<Stripe.Customer>;
    createSetupIntent(customerId: string): Promise<Stripe.SetupIntent>;
    listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]>;
    healthCheck(): Promise<boolean>;
}
declare const stripeService: StripeService;
export default stripeService;
//# sourceMappingURL=stripe.service.d.ts.map