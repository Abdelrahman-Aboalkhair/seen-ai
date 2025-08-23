import { BasePaymentService } from './base-payment.service.js';
import supabaseService from '@/lib/supabase.js';
import logger, { logError } from '@/lib/logger.js';
export class CreditManagementService extends BasePaymentService {
    async handleSuccessfulPayment(userId, credits, paymentIntentId) {
        try {
            const { data: user, error: userError } = await supabaseService.getUser(userId);
            if (userError || !user) {
                throw new Error('User not found');
            }
            const newCredits = user.credits + credits;
            const { error: updateError } = await supabaseService.updateUserCredits(userId, newCredits);
            if (updateError) {
                throw updateError;
            }
            await supabaseService.createCreditTransaction(userId, credits, 'purchase', `Credit purchase via Stripe payment ${paymentIntentId}`);
            logger.info('Credits added successfully', {
                userId,
                creditsAdded: credits,
                newTotal: newCredits,
                paymentIntentId
            });
        }
        catch (error) {
            logError(error, {
                operation: 'handle_successful_payment',
                userId,
                credits,
                paymentIntentId
            });
            throw error;
        }
    }
    async handleRefundCredits(userId, paymentIntentId, refundAmount) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            const originalCredits = parseInt(paymentIntent.metadata.credits || '0');
            if (originalCredits > 0) {
                const refundRatio = refundAmount / paymentIntent.amount;
                const creditsToDeduct = Math.floor(originalCredits * refundRatio);
                const { data: user } = await supabaseService.getUser(userId);
                if (user) {
                    const newCredits = Math.max(0, user.credits - creditsToDeduct);
                    await supabaseService.updateUserCredits(userId, newCredits);
                    await supabaseService.createCreditTransaction(userId, -creditsToDeduct, 'refund', `Credit deduction for refund ${paymentIntentId}`);
                    logger.info('Credits deducted for refund', {
                        userId,
                        creditsDeducted: creditsToDeduct,
                        newTotal: newCredits,
                        paymentIntentId
                    });
                }
            }
        }
        catch (error) {
            logError(error, {
                operation: 'handle_refund_credits',
                userId,
                paymentIntentId
            });
        }
    }
    calculateCreditsForAmount(amount, currency = 'usd') {
        const creditRates = {
            'usd': 100,
            'eur': 110,
        };
        const rate = creditRates[currency.toLowerCase()] || creditRates['usd'];
        return Math.floor(amount / rate);
    }
    calculateAmountForCredits(credits, currency = 'usd') {
        const creditRates = {
            'usd': 100,
            'eur': 110,
        };
        const rate = creditRates[currency.toLowerCase()] || creditRates['usd'];
        return credits * rate;
    }
    async validateCreditTransaction(userId, creditsRequired) {
        try {
            const { data: user, error } = await supabaseService.getUser(userId);
            if (error || !user) {
                return {
                    valid: false,
                    currentCredits: 0,
                    message: 'User not found'
                };
            }
            if (user.credits < creditsRequired) {
                return {
                    valid: false,
                    currentCredits: user.credits,
                    message: `Insufficient credits. Required: ${creditsRequired}, Available: ${user.credits}`
                };
            }
            return {
                valid: true,
                currentCredits: user.credits
            };
        }
        catch (error) {
            logError(error, { operation: 'validate_credit_transaction', userId, creditsRequired });
            return {
                valid: false,
                currentCredits: 0,
                message: 'Validation failed'
            };
        }
    }
    async deductCredits(userId, credits, operation) {
        try {
            const validation = await this.validateCreditTransaction(userId, credits);
            if (!validation.valid) {
                return {
                    success: false,
                    newBalance: validation.currentCredits
                };
            }
            const newCredits = validation.currentCredits - credits;
            const { error: updateError } = await supabaseService.updateUserCredits(userId, newCredits);
            if (updateError) {
                throw updateError;
            }
            const { data: transaction } = await supabaseService.createCreditTransaction(userId, -credits, 'deduction', `Credits deducted for ${operation}`);
            logger.info('Credits deducted successfully', {
                userId,
                creditsDeducted: credits,
                newBalance: newCredits,
                operation
            });
            return {
                success: true,
                newBalance: newCredits,
                transactionId: transaction?.id
            };
        }
        catch (error) {
            logError(error, { operation: 'deduct_credits', userId, credits });
            throw error;
        }
    }
    async addCredits(userId, credits, reason) {
        try {
            const { data: user, error: userError } = await supabaseService.getUser(userId);
            if (userError || !user) {
                throw new Error('User not found');
            }
            const newCredits = user.credits + credits;
            const { error: updateError } = await supabaseService.updateUserCredits(userId, newCredits);
            if (updateError) {
                throw updateError;
            }
            const { data: transaction } = await supabaseService.createCreditTransaction(userId, credits, 'addition', reason);
            logger.info('Credits added successfully', {
                userId,
                creditsAdded: credits,
                newBalance: newCredits,
                reason
            });
            return {
                success: true,
                newBalance: newCredits,
                transactionId: transaction?.id
            };
        }
        catch (error) {
            logError(error, { operation: 'add_credits', userId, credits });
            throw error;
        }
    }
    async getCreditBalance(userId) {
        try {
            const { data: user, error } = await supabaseService.getUser(userId);
            if (error || !user) {
                throw new Error('User not found');
            }
            return user.credits;
        }
        catch (error) {
            logError(error, { operation: 'get_credit_balance', userId });
            throw error;
        }
    }
}
//# sourceMappingURL=credit-management.service.js.map