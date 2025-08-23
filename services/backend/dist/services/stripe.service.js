import Stripe from 'stripe';
import { baseConfig } from '@/config/index.js';
import supabaseService from '@/lib/supabase.js';
import logger, { logError, logExternalAPI } from '@/lib/logger.js';
class StripeService {
    stripe;
    webhookSecret;
    constructor() {
        this.stripe = new Stripe(baseConfig.stripe.secretKey, {
            apiVersion: '2024-11-20.acacia',
            typescript: true,
        });
        this.webhookSecret = baseConfig.stripe.webhookSecret;
        logger.info('Stripe service initialized');
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
                const { data: user } = await supabaseService.getUser(request.userId);
                if (user) {
                    const customer = await this.createOrGetCustomer({
                        userId: request.userId,
                        email: user.email,
                        metadata: request.metadata,
                    });
                    customerId = customer.id;
                }
            }
            const paymentIntent = await this.stripe.paymentIntents.create({
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
            });
            const duration = Date.now() - startTime;
            logExternalAPI('stripe', 'create_payment_intent', duration, true, {
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status,
                amount: request.amount,
            });
            if (paymentIntent.status === 'succeeded') {
                await this.handleSuccessfulPayment(request.userId, request.credits, paymentIntent.id);
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
            logError(error, {
                operation: 'process_payment',
                userId: request.userId,
                amount: request.amount
            });
            throw error;
        }
    }
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
    async processRefund(request) {
        const startTime = Date.now();
        try {
            logger.info('Processing refund', {
                paymentIntentId: request.paymentIntentId,
                amount: request.amount,
                userId: request.userId
            });
            const refund = await this.stripe.refunds.create({
                payment_intent: request.paymentIntentId,
                amount: request.amount,
                reason: request.reason,
                metadata: {
                    userId: request.userId,
                    processedAt: new Date().toISOString(),
                },
            });
            const duration = Date.now() - startTime;
            logExternalAPI('stripe', 'process_refund', duration, true, {
                refundId: refund.id,
                status: refund.status,
                amount: refund.amount,
            });
            if (refund.status === 'succeeded') {
                await this.handleRefundCredits(request.userId, request.paymentIntentId, refund.amount);
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
            logError(error, {
                operation: 'process_refund',
                paymentIntentId: request.paymentIntentId
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
    async createOrGetCustomer(customerData) {
        try {
            const existingCustomers = await this.stripe.customers.list({
                email: customerData.email,
                limit: 1,
            });
            if (existingCustomers.data.length > 0) {
                return existingCustomers.data[0];
            }
            const customer = await this.stripe.customers.create({
                email: customerData.email,
                name: customerData.name,
                metadata: {
                    userId: customerData.userId,
                    ...customerData.metadata,
                },
            });
            logger.info('New Stripe customer created', {
                customerId: customer.id,
                userId: customerData.userId
            });
            return customer;
        }
        catch (error) {
            logError(error, {
                operation: 'create_or_get_customer',
                userId: customerData.userId
            });
            throw error;
        }
    }
    async createSubscription(request) {
        try {
            let customerId = request.customerId;
            if (!customerId) {
                const { data: user } = await supabaseService.getUser(request.userId);
                if (user) {
                    const customer = await this.createOrGetCustomer({
                        userId: request.userId,
                        email: user.email,
                    });
                    customerId = customer.id;
                }
            }
            if (!customerId) {
                throw new Error('Customer ID is required for subscription');
            }
            const subscription = await this.stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: request.priceId }],
                metadata: {
                    userId: request.userId,
                    ...request.metadata,
                },
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
            });
            logger.info('Subscription created', {
                subscriptionId: subscription.id,
                userId: request.userId
            });
            return subscription;
        }
        catch (error) {
            logError(error, {
                operation: 'create_subscription',
                userId: request.userId
            });
            throw error;
        }
    }
    async cancelSubscription(subscriptionId, userId) {
        try {
            const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
            logger.info('Subscription cancelled', {
                subscriptionId,
                userId
            });
            return subscription;
        }
        catch (error) {
            logError(error, {
                operation: 'cancel_subscription',
                subscriptionId,
                userId
            });
            throw error;
        }
    }
    async handleWebhook(rawBody, signature) {
        const startTime = Date.now();
        try {
            const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
            const duration = Date.now() - startTime;
            logExternalAPI('stripe', 'webhook_verified', duration, true, {
                eventType: event.type,
                eventId: event.id,
            });
            logger.info('Stripe webhook received', {
                type: event.type,
                id: event.id
            });
            await this.processWebhookEvent(event);
            return {
                id: event.id,
                type: event.type,
                data: event.data,
                created: event.created,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logExternalAPI('stripe', 'webhook_verification', duration, false, {
                error: error.message,
            });
            logError(error, { operation: 'handle_webhook' });
            throw error;
        }
    }
    async processWebhookEvent(event) {
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentIntentFailed(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    await this.handleInvoicePaymentSucceeded(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object);
                    break;
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;
                default:
                    logger.info('Unhandled webhook event type', { type: event.type });
            }
        }
        catch (error) {
            logError(error, {
                operation: 'process_webhook_event',
                eventType: event.type,
                eventId: event.id
            });
        }
    }
    async handlePaymentIntentSucceeded(paymentIntent) {
        const userId = paymentIntent.metadata.userId;
        const credits = parseInt(paymentIntent.metadata.credits || '0');
        if (userId && credits > 0) {
            await this.handleSuccessfulPayment(userId, credits, paymentIntent.id);
        }
    }
    async handlePaymentIntentFailed(paymentIntent) {
        const userId = paymentIntent.metadata.userId;
        logger.warn('Payment failed', {
            paymentIntentId: paymentIntent.id,
            userId,
            amount: paymentIntent.amount
        });
    }
    async handleInvoicePaymentSucceeded(invoice) {
        logger.info('Invoice payment succeeded', {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid
        });
    }
    async handleSubscriptionDeleted(subscription) {
        const userId = subscription.metadata.userId;
        logger.info('Subscription deleted', {
            subscriptionId: subscription.id,
            userId
        });
    }
    async handleSubscriptionUpdated(subscription) {
        const userId = subscription.metadata.userId;
        logger.info('Subscription updated', {
            subscriptionId: subscription.id,
            userId,
            status: subscription.status
        });
    }
    async getPaymentIntent(paymentIntentId) {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        }
        catch (error) {
            logError(error, {
                operation: 'get_payment_intent',
                paymentIntentId
            });
            throw error;
        }
    }
    async getCustomer(customerId) {
        try {
            const customer = await this.stripe.customers.retrieve(customerId);
            if (customer.deleted) {
                throw new Error('Customer has been deleted');
            }
            return customer;
        }
        catch (error) {
            logError(error, {
                operation: 'get_customer',
                customerId
            });
            throw error;
        }
    }
    async createSetupIntent(customerId) {
        try {
            return await this.stripe.setupIntents.create({
                customer: customerId,
                automatic_payment_methods: { enabled: true },
            });
        }
        catch (error) {
            logError(error, {
                operation: 'create_setup_intent',
                customerId
            });
            throw error;
        }
    }
    async listPaymentMethods(customerId) {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });
            return paymentMethods.data;
        }
        catch (error) {
            logError(error, {
                operation: 'list_payment_methods',
                customerId
            });
            throw error;
        }
    }
    async healthCheck() {
        try {
            await this.stripe.accounts.retrieve();
            return true;
        }
        catch (error) {
            logError(error, { operation: 'stripe_health_check' });
            return false;
        }
    }
}
const stripeService = new StripeService();
export default stripeService;
//# sourceMappingURL=stripe.service.js.map