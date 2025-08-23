import { BasePaymentService } from './base-payment.service.js';
export declare class CreditManagementService extends BasePaymentService {
    handleSuccessfulPayment(userId: string, credits: number, paymentIntentId: string): Promise<void>;
    handleRefundCredits(userId: string, paymentIntentId: string, refundAmount: number): Promise<void>;
    calculateCreditsForAmount(amount: number, currency?: string): number;
    calculateAmountForCredits(credits: number, currency?: string): number;
    validateCreditTransaction(userId: string, creditsRequired: number): Promise<{
        valid: boolean;
        currentCredits: number;
        message?: string;
    }>;
    deductCredits(userId: string, credits: number, operation: string): Promise<{
        success: boolean;
        newBalance: number;
        transactionId?: string;
    }>;
    addCredits(userId: string, credits: number, reason: string): Promise<{
        success: boolean;
        newBalance: number;
        transactionId?: string;
    }>;
    getCreditBalance(userId: string): Promise<number>;
}
//# sourceMappingURL=credit-management.service.d.ts.map