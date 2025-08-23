import { BasePaymentService } from './base-payment.service.js';
import type { PaymentRequest, PaymentResult, RefundRequest, RefundResult } from '@/types/payment.types.js';
export declare class PaymentProcessingService extends BasePaymentService {
    private customerService;
    private creditService;
    constructor();
    processPayment(request: PaymentRequest): Promise<PaymentResult>;
    processRefund(request: RefundRequest): Promise<RefundResult>;
    getPaymentIntent(paymentIntentId: string): Promise<any>;
    createSetupIntent(customerId: string): Promise<any>;
    listPaymentMethods(customerId: string): Promise<any[]>;
    cancelPaymentIntent(paymentIntentId: string): Promise<any>;
    confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<any>;
}
//# sourceMappingURL=payment-processing.service.d.ts.map