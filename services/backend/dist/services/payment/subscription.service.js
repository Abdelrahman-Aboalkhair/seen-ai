import { BasePaymentService } from './base-payment.service.js';
import { CustomerManagementService } from './customer-management.service.js';
import logger from '@/lib/logger.js';
export class SubscriptionService extends BasePaymentService {
    customerService;
    constructor() {
        super();
        this.customerService = new CustomerManagementService();
    }
    async createSubscription(request) {
        try {
            let customerId = request.customerId;
            if (!customerId) {
                const customer = await this.customerService.createOrGetCustomerByUserId(request.userId);
                customerId = customer.id;
            }
            if (!customerId) {
                throw new Error('Customer ID is required for subscription');
            }
            const subscription = await this.withRetry(() => this.stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: request.priceId }],
                metadata: {
                    userId: request.userId,
                    ...request.metadata,
                },
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
            }), 'create_subscription');
            logger.info('Subscription created', {
                subscriptionId: subscription.id,
                userId: request.userId
            });
            return subscription;
        }
        catch (error) {
            throw error;
        }
    }
    async getSubscription(subscriptionId) {
        try {
            return await this.withRetry(() => this.stripe.subscriptions.retrieve(subscriptionId), 'get_subscription');
        }
        catch (error) {
            throw error;
        }
    }
    async updateSubscription(subscriptionId, updates) {
        try {
            return await this.withRetry(() => this.stripe.subscriptions.update(subscriptionId, updates), 'update_subscription');
        }
        catch (error) {
            throw error;
        }
    }
    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await this.withRetry(() => this.stripe.subscriptions.cancel(subscriptionId), 'cancel_subscription');
            logger.info('Subscription cancelled', { subscriptionId });
            return subscription;
        }
        catch (error) {
            throw error;
        }
    }
    async listSubscriptions(options = {}) {
        try {
            return await this.withRetry(() => this.stripe.subscriptions.list(options), 'list_subscriptions');
        }
        catch (error) {
            throw error;
        }
    }
    async listCustomerSubscriptions(customerId) {
        try {
            return await this.withRetry(() => this.stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
            }), 'list_customer_subscriptions');
        }
        catch (error) {
            throw error;
        }
    }
    async pauseSubscription(subscriptionId) {
        try {
            return await this.withRetry(() => this.stripe.subscriptions.update(subscriptionId, {
                pause_collection: {
                    behavior: 'keep_as_draft',
                },
            }), 'pause_subscription');
        }
        catch (error) {
            throw error;
        }
    }
    async resumeSubscription(subscriptionId) {
        try {
            return await this.withRetry(() => this.stripe.subscriptions.update(subscriptionId, {
                pause_collection: null,
            }), 'resume_subscription');
        }
        catch (error) {
            throw error;
        }
    }
    async changeSubscriptionPlan(subscriptionId, newPriceId) {
        try {
            const subscription = await this.getSubscription(subscriptionId);
            const currentItem = subscription.items.data[0];
            return await this.withRetry(() => this.stripe.subscriptions.update(subscriptionId, {
                items: [{
                        id: currentItem.id,
                        price: newPriceId,
                    }],
                proration_behavior: 'create_prorations',
            }), 'change_subscription_plan');
        }
        catch (error) {
            throw error;
        }
    }
    async addSubscriptionItem(subscriptionId, priceId, quantity = 1) {
        try {
            return await this.withRetry(() => this.stripe.subscriptionItems.create({
                subscription: subscriptionId,
                price: priceId,
                quantity,
            }), 'add_subscription_item');
        }
        catch (error) {
            throw error;
        }
    }
    async removeSubscriptionItem(subscriptionItemId) {
        try {
            return await this.withRetry(() => this.stripe.subscriptionItems.del(subscriptionItemId), 'remove_subscription_item');
        }
        catch (error) {
            throw error;
        }
    }
    async getSubscriptionUsage(subscriptionItemId, options = {}) {
        try {
            return await this.withRetry(() => this.stripe.subscriptionItems.listUsageRecords(subscriptionItemId, options), 'get_subscription_usage');
        }
        catch (error) {
            throw error;
        }
    }
    async createUsageRecord(subscriptionItemId, quantity, timestamp) {
        try {
            return await this.withRetry(() => this.stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
                quantity,
                timestamp: timestamp || Math.floor(Date.now() / 1000),
                action: 'increment',
            }), 'create_usage_record');
        }
        catch (error) {
            throw error;
        }
    }
    async getUpcomingInvoice(customerId, subscriptionId) {
        try {
            const params = { customer: customerId };
            if (subscriptionId) {
                params.subscription = subscriptionId;
            }
            return await this.withRetry(() => this.stripe.invoices.retrieveUpcoming(params), 'get_upcoming_invoice');
        }
        catch (error) {
            throw error;
        }
    }
    async previewSubscriptionChanges(subscriptionId, changes) {
        try {
            const subscription = await this.getSubscription(subscriptionId);
            return await this.withRetry(() => this.stripe.invoices.retrieveUpcoming({
                customer: subscription.customer,
                subscription: subscriptionId,
                subscription_items: changes.items,
                subscription_proration_date: Math.floor(Date.now() / 1000),
            }), 'preview_subscription_changes');
        }
        catch (error) {
            throw error;
        }
    }
}
//# sourceMappingURL=subscription.service.js.map