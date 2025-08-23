import { BasePaymentService } from './base-payment.service.js';
import { CustomerManagementService } from './customer-management.service.js';
import { CreditManagementService } from './credit-management.service.js';
import logger, { logExternalAPI } from '@/lib/logger.js';
export class PaymentProcessingService extends BasePaymentService {
    customerService;
    creditService;
    constructor() {
        super();
        this.customerService = new CustomerManagementService();
        this.creditService = new CreditManagementService();
    }
    async processPayment(request) {
        const startTime = Date.now();
        try {
            logger.info('Processing payment', {
                userId: request.userId,
                amount: request.amount,
                credits: request.credits
            });
            let customerId = request.customerId;
            if (!customerId) {
                const customer = await this.customerService.createOrGetCustomerByUserId(request.userId);
                customerId = customer.id;
            }
            const paymentIntent = await this.withRetry(() => this.stripe.paymentIntents.create({
                amount: request.amount,
                currency: request.currency,
                customer: customerId,
                description: request.description,
                payment_method: request.paymentMethodId,
                confirm: !!request.paymentMethodId,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never',
                },
                metadata: {
                    userId: request.userId,
                    credits: request.credits.toString(),
                    ...request.metadata,
                },
            }), 'create_payment_intent');
            const duration = Date.now() - startTime;
            logExternalAPI('stripe', 'create_payment_intent', duration, true, {
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status,
                amount: request.amount,
            });
            if (paymentIntent.status === 'succeeded') {
                await this.creditService.handleSuccessfulPayment(request.userId, request.credits, paymentIntent.id);
            }
            return {
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret || undefined,
                status: paymentIntent.status,
                amount: request.amount,
                currency: request.currency,
                credits: request.credits,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logExternalAPI('stripe', 'process_payment', duration, false, {
                error: error.message,
                userId: request.userId,
            });
            throw error;
        }
    }
    async processRefund(request) {
        const startTime = Date.now();
        try {
            logger.info('Processing refund', {
                paymentIntentId: request.paymentIntentId,
                amount: request.amount,
                userId: request.userId
            });
            const refund = await this.withRetry(() => this.stripe.refunds.create({
                payment_intent: request.paymentIntentId,
                amount: request.amount,
                reason: request.reason,
                metadata: {
                    userId: request.userId,
                    processedAt: new Date().toISOString(),
                },
            }), 'process_refund');
            const duration = Date.now() - startTime;
            logExternalAPI('stripe', 'process_refund', duration, true, {
                refundId: refund.id,
                status: refund.status,
                amount: refund.amount,
            });
            if (refund.status === 'succeeded') {
                await this.creditService.handleRefundCredits(request.userId, request.paymentIntentId, refund.amount);
            }
            return {
                refundId: refund.id,
                status: refund.status,
                amount: refund.amount,
                reason: request.reason || 'requested_by_customer',
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logExternalAPI('stripe', 'process_refund', duration, false, {
                error: error.message,
                paymentIntentId: request.paymentIntentId,
            });
            throw error;
        }
    }
    async getPaymentIntent(paymentIntentId) {
        try {
            return await this.withRetry(() => this.stripe.paymentIntents.retrieve(paymentIntentId), 'get_payment_intent');
        }
        catch (error) {
            throw error;
        }
    }
    async createSetupIntent(customerId) {
        try {
            return await this.withRetry(() => this.stripe.setupIntents.create({
                customer: customerId,
                automatic_payment_methods: { enabled: true },
            }), 'create_setup_intent');
        }
        catch (error) {
            throw error;
        }
    }
    async listPaymentMethods(customerId) {
        try {
            const paymentMethods = await this.withRetry(() => this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            }), 'list_payment_methods');
            return paymentMethods.data;
        }
        catch (error) {
            throw error;
        }
    }
    async cancelPaymentIntent(paymentIntentId) {
        try {
            return await this.withRetry(() => this.stripe.paymentIntents.cancel(paymentIntentId), 'cancel_payment_intent');
        }
        catch (error) {
            throw error;
        }
    }
    async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
        try {
            const params = { payment_intent: paymentIntentId };
            if (paymentMethodId) {
                params.payment_method = paymentMethodId;
            }
            return await this.withRetry(() => this.stripe.paymentIntents.confirm(paymentIntentId, params), 'confirm_payment_intent');
        }
        catch (error) {
            throw error;
        }
    }
}
//# sourceMappingURL=payment-processing.service.js.map