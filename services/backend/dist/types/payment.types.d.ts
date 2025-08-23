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
//# sourceMappingURL=payment.types.d.ts.map