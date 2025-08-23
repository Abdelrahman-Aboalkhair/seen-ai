import { BasePaymentService } from './base-payment.service.js';
import supabaseService from '@/lib/supabase.js';
import logger from '@/lib/logger.js';
import type { CustomerData } from '@/types/payment.types.js';

export class CustomerManagementService extends BasePaymentService {

  // Create or get customer by user data
  async createOrGetCustomer(customerData: CustomerData): Promise<any> {
    try {
      // Try to find existing customer by email
      const existingCustomers = await this.withRetry(
        () => this.stripe.customers.list({
          email: customerData.email,
          limit: 1,
        }),
        'list_customers'
      );

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await this.withRetry(
        () => this.stripe.customers.create({
          email: customerData.email,
          name: customerData.name,
          metadata: {
            userId: customerData.userId,
            ...customerData.metadata,
          },
        }),
        'create_customer'
      );

      logger.info('New Stripe customer created', { 
        customerId: customer.id, 
        userId: customerData.userId 
      });

      return customer;
    } catch (error) {
      throw error;
    }
  }

  // Create or get customer by user ID
  async createOrGetCustomerByUserId(userId: string): Promise<any> {
    try {
      // Get user data from Supabase
      const { data: user, error } = await supabaseService.getUser(userId);
      if (error || !user) {
        throw new Error('User not found');
      }

      return await this.createOrGetCustomer({
        userId,
        email: user.email,
        name: user.name || undefined,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get customer by ID
  async getCustomer(customerId: string): Promise<any> {
    try {
      const customer = await this.withRetry(
        () => this.stripe.customers.retrieve(customerId),
        'get_customer'
      );
      
      if ((customer as any).deleted) {
        throw new Error('Customer has been deleted');
      }
      
      return customer;
    } catch (error) {
      throw error;
    }
  }

  // Update customer information
  async updateCustomer(customerId: string, updates: Partial<CustomerData>): Promise<any> {
    try {
      const updateData: any = {};
      
      if (updates.email) updateData.email = updates.email;
      if (updates.name) updateData.name = updates.name;
      if (updates.metadata) updateData.metadata = updates.metadata;

      return await this.withRetry(
        () => this.stripe.customers.update(customerId, updateData),
        'update_customer'
      );
    } catch (error) {
      throw error;
    }
  }

  // Delete customer
  async deleteCustomer(customerId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.customers.del(customerId),
        'delete_customer'
      );
    } catch (error) {
      throw error;
    }
  }

  // List customers with pagination
  async listCustomers(options: {
    limit?: number;
    startingAfter?: string;
    endingBefore?: string;
    email?: string;
  } = {}): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.customers.list(options),
        'list_customers'
      );
    } catch (error) {
      throw error;
    }
  }

  // Search customers by metadata
  async searchCustomersByUserId(userId: string): Promise<any[]> {
    try {
      const customers = await this.withRetry(
        () => this.stripe.customers.search({
          query: `metadata["userId"]:"${userId}"`,
        }),
        'search_customers'
      );

      return customers.data;
    } catch (error) {
      throw error;
    }
  }

  // Get customer's payment methods
  async getCustomerPaymentMethods(customerId: string, type: string = 'card'): Promise<any[]> {
    try {
      const paymentMethods = await this.withRetry(
        () => this.stripe.paymentMethods.list({
          customer: customerId,
          type: type as any,
        }),
        'get_customer_payment_methods'
      );

      return paymentMethods.data;
    } catch (error) {
      throw error;
    }
  }

  // Attach payment method to customer
  async attachPaymentMethodToCustomer(paymentMethodId: string, customerId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        }),
        'attach_payment_method'
      );
    } catch (error) {
      throw error;
    }
  }

  // Detach payment method from customer
  async detachPaymentMethodFromCustomer(paymentMethodId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.paymentMethods.detach(paymentMethodId),
        'detach_payment_method'
      );
    } catch (error) {
      throw error;
    }
  }

  // Set default payment method for customer
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<any> {
    try {
      return await this.withRetry(
        () => this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        }),
        'set_default_payment_method'
      );
    } catch (error) {
      throw error;
    }
  }
}
