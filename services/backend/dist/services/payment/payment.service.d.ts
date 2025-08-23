export declare class PaymentService {
    private paymentProcessing;
    private customerManagement;
    private creditManagement;
    private webhookHandler;
    private subscriptionService;
    constructor();
    get payments(): {
        process: (request: import("../../types/payment.types.js").PaymentRequest) => Promise<import("../../types/payment.types.js").PaymentResult>;
        refund: (request: import("../../types/payment.types.js").RefundRequest) => Promise<import("../../types/payment.types.js").RefundResult>;
        getPaymentIntent: (paymentIntentId: string) => Promise<any>;
        createSetupIntent: (customerId: string) => Promise<any>;
        listPaymentMethods: (customerId: string) => Promise<any[]>;
        cancelPaymentIntent: (paymentIntentId: string) => Promise<any>;
        confirmPaymentIntent: (paymentIntentId: string, paymentMethodId?: string) => Promise<any>;
    };
    get customers(): {
        createOrGet: (customerData: import("../../types/payment.types.js").CustomerData) => Promise<any>;
        createOrGetByUserId: (userId: string) => Promise<any>;
        get: (customerId: string) => Promise<any>;
        update: (customerId: string, updates: Partial<import("../../types/payment.types.js").CustomerData>) => Promise<any>;
        delete: (customerId: string) => Promise<any>;
        list: (options?: {
            limit?: number;
            startingAfter?: string;
            endingBefore?: string;
            email?: string;
        }) => Promise<any>;
        searchByUserId: (userId: string) => Promise<any[]>;
        getPaymentMethods: (customerId: string, type?: string) => Promise<any[]>;
        attachPaymentMethod: (paymentMethodId: string, customerId: string) => Promise<any>;
        detachPaymentMethod: (paymentMethodId: string) => Promise<any>;
        setDefaultPaymentMethod: (customerId: string, paymentMethodId: string) => Promise<any>;
    };
    get credits(): {
        validate: (userId: string, creditsRequired: number) => Promise<{
            valid: boolean;
            currentCredits: number;
            message?: string;
        }>;
        deduct: (userId: string, credits: number, operation: string) => Promise<{
            success: boolean;
            newBalance: number;
            transactionId?: string;
        }>;
        add: (userId: string, credits: number, reason: string) => Promise<{
            success: boolean;
            newBalance: number;
            transactionId?: string;
        }>;
        getBalance: (userId: string) => Promise<number>;
        calculateCreditsForAmount: (amount: number, currency?: string) => number;
        calculateAmountForCredits: (credits: number, currency?: string) => number;
    };
    get webhooks(): {
        handle: (rawBody: string, signature: string) => Promise<import("../../types/payment.types.js").WebhookEvent | null>;
    };
    get subscriptions(): {
        create: (request: import("../../types/payment.types.js").SubscriptionRequest) => Promise<any>;
        get: (subscriptionId: string) => Promise<any>;
        update: (subscriptionId: string, updates: any) => Promise<any>;
        cancel: (subscriptionId: string) => Promise<any>;
        list: (options?: {
            limit?: number;
            startingAfter?: string;
            endingBefore?: string;
            status?: string;
            price?: string;
        }) => Promise<any>;
        listByCustomer: (customerId: string) => Promise<any>;
    };
    healthCheck(): Promise<{
        overall: boolean;
        services: {
            paymentProcessing: boolean;
            customerManagement: boolean;
            creditManagement: boolean;
            webhookHandler: boolean;
            subscriptions: boolean;
        };
    }>;
    getServiceStats(): Promise<{
        uptime: number;
        services: string[];
        healthStatus: any;
    }>;
}
declare const paymentService: PaymentService;
export default paymentService;
//# sourceMappingURL=payment.service.d.ts.map