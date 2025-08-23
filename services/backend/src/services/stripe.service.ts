import Stripe from 'stripe';
import { baseConfig } from '@/config/index.js';
import supabaseService from '@/lib/supabase.js';
import logger, { logError, logExternalAPI, logPerformance } from '@/lib/logger.js';

export interface PaymentRequest {
  amount: number; // in cents
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
  amount?: number; // partial refund amount in cents
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

class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    this.stripe = new Stripe(baseConfig.stripe.secretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
    
    this.webhookSecret = baseConfig.stripe.webhookSecret;
    logger.info('Stripe service initialized');
  }

  // Process payment with error handling and retry logic
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Processing payment', { 
        userId: request.userId, 
        amount: request.amount,
        credits: request.credits 
      });

      // Create or retrieve customer
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

      // Create payment intent
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

      // If payment is successful, add credits to user account
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
    } catch (error) {
      const duration = Date.now() - startTime;
      logExternalAPI('stripe', 'process_payment', duration, false, {
        error: (error as Error).message,
        userId: request.userId,
      });
      
      logError(error as Error, { 
        operation: 'process_payment', 
        userId: request.userId,
        amount: request.amount 
      });
      throw error;
    }
  }

  // Handle successful payment
  private async handleSuccessfulPayment(userId: string, credits: number, paymentIntentId: string) {
    try {
      // Get current user credits
      const { data: user, error: userError } = await supabaseService.getUser(userId);
      if (userError || !user) {
        throw new Error('User not found');
      }

      // Update user credits
      const newCredits = user.credits + credits;
      const { error: updateError } = await supabaseService.updateUserCredits(userId, newCredits);
      
      if (updateError) {
        throw updateError;
      }

      // Create credit transaction record
      await supabaseService.createCreditTransaction(
        userId,
        credits,
        'purchase',
        `Credit purchase via Stripe payment ${paymentIntentId}`
      );

      logger.info('Credits added successfully', { 
        userId, 
        creditsAdded: credits, 
        newTotal: newCredits,
        paymentIntentId 
      });
    } catch (error) {
      logError(error as Error, { 
        operation: 'handle_successful_payment', 
        userId, 
        credits,
        paymentIntentId 
      });
      throw error;
    }
  }

  // Process refund
  async processRefund(request: RefundRequest): Promise<RefundResult> {
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
        reason: request.reason as Stripe.RefundCreateParams.Reason,
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

      // Handle credit deduction if needed
      if (refund.status === 'succeeded') {
        await this.handleRefundCredits(request.userId, request.paymentIntentId, refund.amount);
      }

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
        reason: request.reason || 'requested_by_customer',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logExternalAPI('stripe', 'process_refund', duration, false, {
        error: (error as Error).message,
        paymentIntentId: request.paymentIntentId,
      });
      
      logError(error as Error, { 
        operation: 'process_refund', 
        paymentIntentId: request.paymentIntentId 
      });
      throw error;
    }
  }

  // Handle credit deduction for refunds
  private async handleRefundCredits(userId: string, paymentIntentId: string, refundAmount: number) {
    try {
      // Retrieve the original payment intent to get credit amount
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      const originalCredits = parseInt(paymentIntent.metadata.credits || '0');
      
      if (originalCredits > 0) {
        // Calculate credits to deduct based on refund amount
        const refundRatio = refundAmount / paymentIntent.amount;
        const creditsToDeduct = Math.floor(originalCredits * refundRatio);
        
        // Get current user credits
        const { data: user } = await supabaseService.getUser(userId);
        if (user) {
          const newCredits = Math.max(0, user.credits - creditsToDeduct);
          
          // Update user credits
          await supabaseService.updateUserCredits(userId, newCredits);
          
          // Create credit transaction record
          await supabaseService.createCreditTransaction(
            userId,
            -creditsToDeduct,
            'refund',
            `Credit deduction for refund ${paymentIntentId}`
          );

          logger.info('Credits deducted for refund', { 
            userId, 
            creditsDeducted: creditsToDeduct, 
            newTotal: newCredits,
            paymentIntentId 
          });
        }
      }
    } catch (error) {
      logError(error as Error, { 
        operation: 'handle_refund_credits', 
        userId, 
        paymentIntentId 
      });
      // Don't throw here - refund was successful, credit adjustment is secondary
    }
  }

  // Create or get customer
  async createOrGetCustomer(customerData: CustomerData): Promise<Stripe.Customer> {
    try {
      // Try to find existing customer by metadata userId
      const existingCustomers = await this.stripe.customers.list({
        email: customerData.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0]!;
      }

      // Create new customer
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
    } catch (error) {
      logError(error as Error, { 
        operation: 'create_or_get_customer', 
        userId: customerData.userId 
      });
      throw error;
    }
  }

  // Create subscription
  async createSubscription(request: SubscriptionRequest): Promise<Stripe.Subscription> {
    try {
      // Create or get customer
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
    } catch (error) {
      logError(error as Error, { 
        operation: 'create_subscription', 
        userId: request.userId 
      });
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, userId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      
      logger.info('Subscription cancelled', { 
        subscriptionId, 
        userId 
      });

      return subscription;
    } catch (error) {
      logError(error as Error, { 
        operation: 'cancel_subscription', 
        subscriptionId, 
        userId 
      });
      throw error;
    }
  }

  // Handle webhook events
  async handleWebhook(rawBody: string, signature: string): Promise<WebhookEvent | null> {
    const startTime = Date.now();
    
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );

      const duration = Date.now() - startTime;
      logExternalAPI('stripe', 'webhook_verified', duration, true, {
        eventType: event.type,
        eventId: event.id,
      });

      logger.info('Stripe webhook received', { 
        type: event.type, 
        id: event.id 
      });

      // Handle different event types
      await this.processWebhookEvent(event);

      return {
        id: event.id,
        type: event.type,
        data: event.data,
        created: event.created,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logExternalAPI('stripe', 'webhook_verification', duration, false, {
        error: (error as Error).message,
      });
      
      logError(error as Error, { operation: 'handle_webhook' });
      throw error;
    }
  }

  // Process webhook events
  private async processWebhookEvent(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
          
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
          
        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }
    } catch (error) {
      logError(error as Error, { 
        operation: 'process_webhook_event', 
        eventType: event.type,
        eventId: event.id 
      });
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const userId = paymentIntent.metadata.userId;
    const credits = parseInt(paymentIntent.metadata.credits || '0');
    
    if (userId && credits > 0) {
      await this.handleSuccessfulPayment(userId, credits, paymentIntent.id);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const userId = paymentIntent.metadata.userId;
    
    logger.warn('Payment failed', { 
      paymentIntentId: paymentIntent.id, 
      userId,
      amount: paymentIntent.amount 
    });
    
    // Could send notification to user about failed payment
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    logger.info('Invoice payment succeeded', { 
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_paid 
    });
    
    // Handle subscription-based credit additions if needed
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    
    logger.info('Subscription deleted', { 
      subscriptionId: subscription.id, 
      userId 
    });
    
    // Handle subscription cancellation logic
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    
    logger.info('Subscription updated', { 
      subscriptionId: subscription.id, 
      userId,
      status: subscription.status 
    });
    
    // Handle subscription changes
  }

  // Get payment intent
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logError(error as Error, { 
        operation: 'get_payment_intent', 
        paymentIntentId 
      });
      throw error;
    }
  }

  // Get customer
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
      
      return customer as Stripe.Customer;
    } catch (error) {
      logError(error as Error, { 
        operation: 'get_customer', 
        customerId 
      });
      throw error;
    }
  }

  // Create setup intent for saving payment methods
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      return await this.stripe.setupIntents.create({
        customer: customerId,
        automatic_payment_methods: { enabled: true },
      });
    } catch (error) {
      logError(error as Error, { 
        operation: 'create_setup_intent', 
        customerId 
      });
      throw error;
    }
  }

  // List customer payment methods
  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      
      return paymentMethods.data;
    } catch (error) {
      logError(error as Error, { 
        operation: 'list_payment_methods', 
        customerId 
      });
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Try to retrieve account info
      await this.stripe.accounts.retrieve();
      return true;
    } catch (error) {
      logError(error as Error, { operation: 'stripe_health_check' });
      return false;
    }
  }
}

// Create singleton instance
const stripeService = new StripeService();

export default stripeService;
