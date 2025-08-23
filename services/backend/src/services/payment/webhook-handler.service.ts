import { BasePaymentService } from './base-payment.service.js';
import { CreditManagementService } from './credit-management.service.js';
import logger, { logError, logExternalAPI } from '@/lib/logger.js';
import type { WebhookEvent } from '@/types/payment.types.js';

export class WebhookHandlerService extends BasePaymentService {
  private creditService: CreditManagementService;

  constructor() {
    super();
    this.creditService = new CreditManagementService();
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
      
      throw error;
    }
  }

  // Process webhook events
  private async processWebhookEvent(event: any): Promise<void> {
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
    } catch (error) {
      logError(error as Error, { 
        operation: 'process_webhook_event', 
        eventType: event.type,
        eventId: event.id 
      });
    }
  }

  // Handle payment intent succeeded
  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
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

  // Handle payment intent failed
  private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    const userId = paymentIntent.metadata.userId;
    
    logger.warn('Payment failed', { 
      paymentIntentId: paymentIntent.id, 
      userId,
      amount: paymentIntent.amount,
      lastPaymentError: paymentIntent.last_payment_error?.message
    });
    
    // Could send notification to user about failed payment
    // await this.sendPaymentFailedNotification(userId, paymentIntent);
  }

  // Handle payment intent canceled
  private async handlePaymentIntentCanceled(paymentIntent: any): Promise<void> {
    const userId = paymentIntent.metadata.userId;
    
    logger.info('Payment intent canceled', { 
      paymentIntentId: paymentIntent.id, 
      userId,
      amount: paymentIntent.amount 
    });
  }

  // Handle invoice payment succeeded
  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    logger.info('Invoice payment succeeded', { 
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_paid 
    });
    
    // Handle subscription-based credit additions if needed
    if (invoice.subscription && invoice.metadata?.userId) {
      // Process subscription credits
      await this.processSubscriptionCredits(invoice);
    }
  }

  // Handle invoice payment failed
  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    logger.warn('Invoice payment failed', { 
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_due 
    });
  }

  // Handle subscription created
  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    const userId = subscription.metadata.userId;
    
    logger.info('Subscription created', { 
      subscriptionId: subscription.id, 
      userId,
      status: subscription.status 
    });
  }

  // Handle subscription updated
  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const userId = subscription.metadata.userId;
    
    logger.info('Subscription updated', { 
      subscriptionId: subscription.id, 
      userId,
      status: subscription.status 
    });
    
    // Handle subscription changes (upgrade/downgrade)
    if (subscription.status === 'active') {
      await this.processSubscriptionActivation(subscription);
    } else if (subscription.status === 'canceled') {
      await this.processSubscriptionCancellation(subscription);
    }
  }

  // Handle subscription deleted
  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const userId = subscription.metadata.userId;
    
    logger.info('Subscription deleted', { 
      subscriptionId: subscription.id, 
      userId 
    });
    
    await this.processSubscriptionCancellation(subscription);
  }

  // Handle customer created
  private async handleCustomerCreated(customer: any): Promise<void> {
    logger.info('Customer created', { 
      customerId: customer.id,
      userId: customer.metadata?.userId,
      email: customer.email 
    });
  }

  // Handle customer updated
  private async handleCustomerUpdated(customer: any): Promise<void> {
    logger.info('Customer updated', { 
      customerId: customer.id,
      userId: customer.metadata?.userId,
      email: customer.email 
    });
  }

  // Handle payment method attached
  private async handlePaymentMethodAttached(paymentMethod: any): Promise<void> {
    logger.info('Payment method attached', { 
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer,
      type: paymentMethod.type 
    });
  }

  // Process subscription credits
  private async processSubscriptionCredits(invoice: any): Promise<void> {
    try {
      const userId = invoice.metadata?.userId;
      if (!userId) return;

      // Calculate credits based on subscription amount
      const credits = this.creditService.calculateCreditsForAmount(invoice.amount_paid);
      
      if (credits > 0) {
        await this.creditService.addCredits(
          userId,
          credits,
          `Subscription credits for invoice ${invoice.id}`
        );
      }
    } catch (error) {
      logError(error as Error, { 
        operation: 'process_subscription_credits',
        invoiceId: invoice.id 
      });
    }
  }

  // Process subscription activation
  private async processSubscriptionActivation(subscription: any): Promise<void> {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) return;

      // Handle subscription activation logic
      logger.info('Processing subscription activation', { 
        subscriptionId: subscription.id,
        userId 
      });
      
      // Could add welcome credits or other benefits
    } catch (error) {
      logError(error as Error, { 
        operation: 'process_subscription_activation',
        subscriptionId: subscription.id 
      });
    }
  }

  // Process subscription cancellation
  private async processSubscriptionCancellation(subscription: any): Promise<void> {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) return;

      // Handle subscription cancellation logic
      logger.info('Processing subscription cancellation', { 
        subscriptionId: subscription.id,
        userId 
      });
      
      // Could remove premium features or send notifications
    } catch (error) {
      logError(error as Error, { 
        operation: 'process_subscription_cancellation',
        subscriptionId: subscription.id 
      });
    }
  }
}
