import { BasePaymentService } from './base-payment.service.js';
import { CustomerManagementService } from './customer-management.service.js';
import { CreditManagementService } from './credit-management.service.js';
import logger, { logExternalAPI } from '@/lib/logger.js';
import type { PaymentRequest, PaymentResult, RefundRequest, RefundResult } from '@/types/payment.types.js';

export class PaymentProcessingService extends BasePaymentService {
  private customerService: CustomerManagementService;
  private creditService: CreditManagementService;

  constructor() {
    super();
    this.customerService = new CustomerManagementService();
    this.creditService = new CreditManagementService();
  }

  // Process payment with error handling
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
        const customer = await this.customerService.createOrGetCustomerByUserId(request.userId);
        customerId = customer.id;
      }

      // Create payment intent
      const paymentIntent = await this.withRetry(
        () => this.stripe.paymentIntents.create({
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
        }),
        'create_payment_intent'
      );

      const duration = Date.now() - startTime;
      logExternalAPI('stripe', 'create_payment_intent', duration, true, {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: request.amount,
      });

      // If payment is successful, add credits to user account
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
    } catch (error) {
      const duration = Date.now() - startTime;
      logExternalAPI('stripe', 'process_payment', duration, false, {
        error: (error as Error).message,
        userId: request.userId,
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

      const refund = await this.withRetry(
        () => this.stripe.refunds.create({
          payment_intent: request.paymentIntentId,
          amount: request.amount,
          reason: request.reason as Stripe.RefundCreateParams.Reason,
          metadata: {
            userId: request.userId,
            processedAt: new Date().toISOString(),
          },
        }),
        'process_refund'
      );

      const duration = Date.now() - startTime;
      logExternalAPI('stripe', 'process_refund', duration, true, {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
      });

      // Handle credit deduction if needed
      if (refund.status === 'succeeded') {
        await this.creditService.handleRefundCredits(request.userId, request.paymentIntentId, refund.amount);
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
      
      throw error;
    }
  }

  // Get payment intent
  async getPaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.paymentIntents.retrieve(paymentIntentId),
        'get_payment_intent'
      );
    } catch (error) {
      throw error;
    }
  }

  // Create setup intent for saving payment methods
  async createSetupIntent(customerId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.setupIntents.create({
          customer: customerId,
          automatic_payment_methods: { enabled: true },
        }),
        'create_setup_intent'
      );
    } catch (error) {
      throw error;
    }
  }

  // List customer payment methods
  async listPaymentMethods(customerId: string): Promise<any[]> {
    try {
      const paymentMethods = await this.withRetry(
        () => this.stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        }),
        'list_payment_methods'
      );
      
      return paymentMethods.data;
    } catch (error) {
      throw error;
    }
  }

  // Cancel payment intent
  async cancelPaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.paymentIntents.cancel(paymentIntentId),
        'cancel_payment_intent'
      );
    } catch (error) {
      throw error;
    }
  }

  // Confirm payment intent
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<any> {
    try {
      const params: any = { payment_intent: paymentIntentId };
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      return await this.withRetry(
        () => this.stripe.paymentIntents.confirm(paymentIntentId, params),
        'confirm_payment_intent'
      );
    } catch (error) {
      throw error;
    }
  }
}
