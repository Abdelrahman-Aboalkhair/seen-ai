import { BasePaymentService } from './base-payment.service.js';
import { CreditManagementService } from './credit-management.service.js';
import logger, { logError, logExternalAPI } from '@/lib/logger.js';
export class WebhookHandlerService extends BasePaymentService {
    creditService;
    constructor() {
        super();
        this.creditService = new CreditManagementService();
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
                case 'payment_intent.canceled':
                    await this.handlePaymentIntentCanceled(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    await this.handleInvoicePaymentSucceeded(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await this.handleInvoicePaymentFailed(event.data.object);
                    break;
                case 'customer.subscription.created':
                    await this.handleSubscriptionCreated(event.data.object);
                    break;
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object);
                    break;
                case 'customer.created':
                    await this.handleCustomerCreated(event.data.object);
                    break;
                case 'customer.updated':
                    await this.handleCustomerUpdated(event.data.object);
                    break;
                case 'payment_method.attached':
                    await this.handlePaymentMethodAttached(event.data.object);
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
            await this.creditService.handleSuccessfulPayment(userId, credits, paymentIntent.id);
        }
        logger.info('Payment intent succeeded processed', {
            paymentIntentId: paymentIntent.id,
            userId,
            credits,
            amount: paymentIntent.amount
        });
    }
    async handlePaymentIntentFailed(paymentIntent) {
        const userId = paymentIntent.metadata.userId;
        logger.warn('Payment failed', {
            paymentIntentId: paymentIntent.id,
            userId,
            amount: paymentIntent.amount,
            lastPaymentError: paymentIntent.last_payment_error?.message
        });
    }
    async handlePaymentIntentCanceled(paymentIntent) {
        const userId = paymentIntent.metadata.userId;
        logger.info('Payment intent canceled', {
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
        if (invoice.subscription && invoice.metadata?.userId) {
            await this.processSubscriptionCredits(invoice);
        }
    }
    async handleInvoicePaymentFailed(invoice) {
        logger.warn('Invoice payment failed', {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            amount: invoice.amount_due
        });
    }
    async handleSubscriptionCreated(subscription) {
        const userId = subscription.metadata.userId;
        logger.info('Subscription created', {
            subscriptionId: subscription.id,
            userId,
            status: subscription.status
        });
    }
    async handleSubscriptionUpdated(subscription) {
        const userId = subscription.metadata.userId;
        logger.info('Subscription updated', {
            subscriptionId: subscription.id,
            userId,
            status: subscription.status
        });
        if (subscription.status === 'active') {
            await this.processSubscriptionActivation(subscription);
        }
        else if (subscription.status === 'canceled') {
            await this.processSubscriptionCancellation(subscription);
        }
    }
    async handleSubscriptionDeleted(subscription) {
        const userId = subscription.metadata.userId;
        logger.info('Subscription deleted', {
            subscriptionId: subscription.id,
            userId
        });
        await this.processSubscriptionCancellation(subscription);
    }
    async handleCustomerCreated(customer) {
        logger.info('Customer created', {
            customerId: customer.id,
            userId: customer.metadata?.userId,
            email: customer.email
        });
    }
    async handleCustomerUpdated(customer) {
        logger.info('Customer updated', {
            customerId: customer.id,
            userId: customer.metadata?.userId,
            email: customer.email
        });
    }
    async handlePaymentMethodAttached(paymentMethod) {
        logger.info('Payment method attached', {
            paymentMethodId: paymentMethod.id,
            customerId: paymentMethod.customer,
            type: paymentMethod.type
        });
    }
    async processSubscriptionCredits(invoice) {
        try {
            const userId = invoice.metadata?.userId;
            if (!userId)
                return;
            const credits = this.creditService.calculateCreditsForAmount(invoice.amount_paid);
            if (credits > 0) {
                await this.creditService.addCredits(userId, credits, `Subscription credits for invoice ${invoice.id}`);
            }
        }
        catch (error) {
            logError(error, {
                operation: 'process_subscription_credits',
                invoiceId: invoice.id
            });
        }
    }
    async processSubscriptionActivation(subscription) {
        try {
            const userId = subscription.metadata?.userId;
            if (!userId)
                return;
            logger.info('Processing subscription activation', {
                subscriptionId: subscription.id,
                userId
            });
        }
        catch (error) {
            logError(error, {
                operation: 'process_subscription_activation',
                subscriptionId: subscription.id
            });
        }
    }
    async processSubscriptionCancellation(subscription) {
        try {
            const userId = subscription.metadata?.userId;
            if (!userId)
                return;
            logger.info('Processing subscription cancellation', {
                subscriptionId: subscription.id,
                userId
            });
        }
        catch (error) {
            logError(error, {
                operation: 'process_subscription_cancellation',
                subscriptionId: subscription.id
            });
        }
    }
}
//# sourceMappingURL=webhook-handler.service.js.map