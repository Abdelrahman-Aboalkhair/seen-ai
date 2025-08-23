import { BasePaymentService } from './base-payment.service.js';
import { CustomerManagementService } from './customer-management.service.js';
import supabaseService from '@/lib/supabase.js';
import logger from '@/lib/logger.js';
import type { SubscriptionRequest } from '@/types/payment.types.js';

export class SubscriptionService extends BasePaymentService {
  private customerService: CustomerManagementService;

  constructor() {
    super();
    this.customerService = new CustomerManagementService();
  }

  // Create subscription
  async createSubscription(request: SubscriptionRequest): Promise<any> {
    try {
      // Create or get customer
      let customerId = request.customerId;
      if (!customerId) {
        const customer = await this.customerService.createOrGetCustomerByUserId(request.userId);
        customerId = customer.id;
      }

      if (!customerId) {
        throw new Error('Customer ID is required for subscription');
      }

      const subscription = await this.withRetry(
        () => this.stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: request.priceId }],
          metadata: {
            userId: request.userId,
            ...request.metadata,
          },
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
        }),
        'create_subscription'
      );

      logger.info('Subscription created', { 
        subscriptionId: subscription.id, 
        userId: request.userId 
      });

      return subscription;
    } catch (error) {
      throw error;
    }
  }

  // Get subscription
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.subscriptions.retrieve(subscriptionId),
        'get_subscription'
      );
    } catch (error) {
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId: string, updates: any): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.subscriptions.update(subscriptionId, updates),
        'update_subscription'
      );
    } catch (error) {
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<any> {
    try {
      const subscription = await this.withRetry(
        () => this.stripe.subscriptions.cancel(subscriptionId),
        'cancel_subscription'
      );
      
      logger.info('Subscription cancelled', { subscriptionId });
      return subscription;
    } catch (error) {
      throw error;
    }
  }

  // List subscriptions with filters
  async listSubscriptions(options: {
    limit?: number;
    startingAfter?: string;
    endingBefore?: string;
    status?: string;
    price?: string;
  } = {}): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.subscriptions.list(options),
        'list_subscriptions'
      );
    } catch (error) {
      throw error;
    }
  }

  // List customer subscriptions
  async listCustomerSubscriptions(customerId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
        }),
        'list_customer_subscriptions'
      );
    } catch (error) {
      throw error;
    }
  }

  // Pause subscription
  async pauseSubscription(subscriptionId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.subscriptions.update(subscriptionId, {
          pause_collection: {
            behavior: 'keep_as_draft',
          },
        }),
        'pause_subscription'
      );
    } catch (error) {
      throw error;
    }
  }

  // Resume subscription
  async resumeSubscription(subscriptionId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.subscriptions.update(subscriptionId, {
          pause_collection: null,
        }),
        'resume_subscription'
      );
    } catch (error) {
      throw error;
    }
  }

  // Change subscription plan
  async changeSubscriptionPlan(subscriptionId: string, newPriceId: string): Promise<any> {
    try {
      // Get current subscription
      const subscription = await this.getSubscription(subscriptionId);
      const currentItem = subscription.items.data[0];

      return await this.withRetry(
        () => this.stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: currentItem.id,
            price: newPriceId,
          }],
          proration_behavior: 'create_prorations',
        }),
        'change_subscription_plan'
      );
    } catch (error) {
      throw error;
    }
  }

  // Add subscription item
  async addSubscriptionItem(subscriptionId: string, priceId: string, quantity: number = 1): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.subscriptionItems.create({
          subscription: subscriptionId,
          price: priceId,
          quantity,
        }),
        'add_subscription_item'
      );
    } catch (error) {
      throw error;
    }
  }

  // Remove subscription item
  async removeSubscriptionItem(subscriptionItemId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.subscriptionItems.del(subscriptionItemId),
        'remove_subscription_item'
      );
    } catch (error) {
      throw error;
    }
  }

  // Get subscription usage
  async getSubscriptionUsage(subscriptionItemId: string, options: {
    limit?: number;
    startingAfter?: string;
    endingBefore?: string;
  } = {}): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.subscriptionItems.listUsageRecords(subscriptionItemId, options),
        'get_subscription_usage'
      );
    } catch (error) {
      throw error;
    }
  }

  // Create usage record
  async createUsageRecord(subscriptionItemId: string, quantity: number, timestamp?: number): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action: 'increment',
        }),
        'create_usage_record'
      );
    } catch (error) {
      throw error;
    }
  }

  // Get upcoming invoice for subscription
  async getUpcomingInvoice(customerId: string, subscriptionId?: string): Promise<any> {
    try {
      const params: any = { customer: customerId };
      if (subscriptionId) {
        params.subscription = subscriptionId;
      }

      return await this.withRetry(
        () => this.stripe.invoices.retrieveUpcoming(params),
        'get_upcoming_invoice'
      );
    } catch (error) {
      throw error;
    }
  }

  // Preview subscription changes
  async previewSubscriptionChanges(subscriptionId: string, changes: any): Promise<any> {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      
      return await this.withRetry(
        () => this.stripe.invoices.retrieveUpcoming({
          customer: subscription.customer,
          subscription: subscriptionId,
          subscription_items: changes.items,
          subscription_proration_date: Math.floor(Date.now() / 1000),
        }),
        'preview_subscription_changes'
      );
    } catch (error) {
      throw error;
    }
  }
}
