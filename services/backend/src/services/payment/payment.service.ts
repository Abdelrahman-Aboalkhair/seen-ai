import { PaymentProcessingService } from './payment-processing.service.js';
import { CustomerManagementService } from './customer-management.service.js';
import { CreditManagementService } from './credit-management.service.js';
import { WebhookHandlerService } from './webhook-handler.service.js';
import { SubscriptionService } from './subscription.service.js';
import logger from '@/lib/logger.js';

// Main Payment Service that orchestrates all payment operations
export class PaymentService {
  private paymentProcessing: PaymentProcessingService;
  private customerManagement: CustomerManagementService;
  private creditManagement: CreditManagementService;
  private webhookHandler: WebhookHandlerService;
  private subscriptionService: SubscriptionService;

  constructor() {
    this.paymentProcessing = new PaymentProcessingService();
    this.customerManagement = new CustomerManagementService();
    this.creditManagement = new CreditManagementService();
    this.webhookHandler = new WebhookHandlerService();
    this.subscriptionService = new SubscriptionService();

    logger.info('Payment Service initialized with all sub-services');
  }

  // Payment Processing operations
  get payments() {
    return {
      process: this.paymentProcessing.processPayment.bind(this.paymentProcessing),
      refund: this.paymentProcessing.processRefund.bind(this.paymentProcessing),
      getPaymentIntent: this.paymentProcessing.getPaymentIntent.bind(this.paymentProcessing),
      createSetupIntent: this.paymentProcessing.createSetupIntent.bind(this.paymentProcessing),
      listPaymentMethods: this.paymentProcessing.listPaymentMethods.bind(this.paymentProcessing),
      cancelPaymentIntent: this.paymentProcessing.cancelPaymentIntent.bind(this.paymentProcessing),
      confirmPaymentIntent: this.paymentProcessing.confirmPaymentIntent.bind(this.paymentProcessing),
    };
  }

  // Customer Management operations
  get customers() {
    return {
      createOrGet: this.customerManagement.createOrGetCustomer.bind(this.customerManagement),
      createOrGetByUserId: this.customerManagement.createOrGetCustomerByUserId.bind(this.customerManagement),
      get: this.customerManagement.getCustomer.bind(this.customerManagement),
      update: this.customerManagement.updateCustomer.bind(this.customerManagement),
      delete: this.customerManagement.deleteCustomer.bind(this.customerManagement),
      list: this.customerManagement.listCustomers.bind(this.customerManagement),
      searchByUserId: this.customerManagement.searchCustomersByUserId.bind(this.customerManagement),
      getPaymentMethods: this.customerManagement.getCustomerPaymentMethods.bind(this.customerManagement),
      attachPaymentMethod: this.customerManagement.attachPaymentMethodToCustomer.bind(this.customerManagement),
      detachPaymentMethod: this.customerManagement.detachPaymentMethodFromCustomer.bind(this.customerManagement),
      setDefaultPaymentMethod: this.customerManagement.setDefaultPaymentMethod.bind(this.customerManagement),
    };
  }

  // Credit Management operations
  get credits() {
    return {
      validate: this.creditManagement.validateCreditTransaction.bind(this.creditManagement),
      deduct: this.creditManagement.deductCredits.bind(this.creditManagement),
      add: this.creditManagement.addCredits.bind(this.creditManagement),
      getBalance: this.creditManagement.getCreditBalance.bind(this.creditManagement),
      calculateCreditsForAmount: this.creditManagement.calculateCreditsForAmount.bind(this.creditManagement),
      calculateAmountForCredits: this.creditManagement.calculateAmountForCredits.bind(this.creditManagement),
    };
  }

  // Webhook operations
  get webhooks() {
    return {
      handle: this.webhookHandler.handleWebhook.bind(this.webhookHandler),
    };
  }

  // Subscription operations
  get subscriptions() {
    return {
      create: this.subscriptionService.createSubscription.bind(this.subscriptionService),
      get: this.subscriptionService.getSubscription.bind(this.subscriptionService),
      update: this.subscriptionService.updateSubscription.bind(this.subscriptionService),
      cancel: this.subscriptionService.cancelSubscription.bind(this.subscriptionService),
      list: this.subscriptionService.listSubscriptions.bind(this.subscriptionService),
      listByCustomer: this.subscriptionService.listCustomerSubscriptions.bind(this.subscriptionService),
    };
  }

  // Health check for all payment services
  async healthCheck(): Promise<{
    overall: boolean;
    services: {
      paymentProcessing: boolean;
      customerManagement: boolean;
      creditManagement: boolean;
      webhookHandler: boolean;
      subscriptions: boolean;
    };
  }> {
    try {
      const [payments, customers, credits, webhooks, subscriptions] = await Promise.all([
        this.paymentProcessing.healthCheck(),
        this.customerManagement.healthCheck(),
        this.creditManagement.healthCheck(),
        this.webhookHandler.healthCheck(),
        this.subscriptionService.healthCheck(),
      ]);

      const services = {
        paymentProcessing: payments,
        customerManagement: customers,
        creditManagement: credits,
        webhookHandler: webhooks,
        subscriptions: subscriptions,
      };

      const overall = Object.values(services).every(status => status);

      return { overall, services };
    } catch (error) {
      logger.error('Payment Service health check failed', { error: (error as Error).message });
      return {
        overall: false,
        services: {
          paymentProcessing: false,
          customerManagement: false,
          creditManagement: false,
          webhookHandler: false,
          subscriptions: false,
        },
      };
    }
  }

  // Get service statistics
  async getServiceStats(): Promise<{
    uptime: number;
    services: string[];
    healthStatus: any;
  }> {
    const healthStatus = await this.healthCheck();
    
    return {
      uptime: process.uptime(),
      services: ['paymentProcessing', 'customerManagement', 'creditManagement', 'webhookHandler', 'subscriptions'],
      healthStatus,
    };
  }
}

// Create singleton instance
const paymentService = new PaymentService();

export default paymentService;
