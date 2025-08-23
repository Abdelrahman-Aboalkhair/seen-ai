import { BasePaymentService } from './base-payment.service.js';
import supabaseService from '@/lib/supabase.js';
import logger from '@/lib/logger.js';
export class CustomerManagementService extends BasePaymentService {
    async createOrGetCustomer(customerData) {
        try {
            const existingCustomers = await this.withRetry(() => this.stripe.customers.list({
                email: customerData.email,
                limit: 1,
            }), 'list_customers');
            if (existingCustomers.data.length > 0) {
                return existingCustomers.data[0];
            }
            const customer = await this.withRetry(() => this.stripe.customers.create({
                email: customerData.email,
                name: customerData.name,
                metadata: {
                    userId: customerData.userId,
                    ...customerData.metadata,
                },
            }), 'create_customer');
            logger.info('New Stripe customer created', {
                customerId: customer.id,
                userId: customerData.userId
            });
            return customer;
        }
        catch (error) {
            throw error;
        }
    }
    async createOrGetCustomerByUserId(userId) {
        try {
            const { data: user, error } = await supabaseService.getUser(userId);
            if (error || !user) {
                throw new Error('User not found');
            }
            return await this.createOrGetCustomer({
                userId,
                email: user.email,
                name: user.name || undefined,
            });
        }
        catch (error) {
            throw error;
        }
    }
    async getCustomer(customerId) {
        try {
            const customer = await this.withRetry(() => this.stripe.customers.retrieve(customerId), 'get_customer');
            if (customer.deleted) {
                throw new Error('Customer has been deleted');
            }
            return customer;
        }
        catch (error) {
            throw error;
        }
    }
    async updateCustomer(customerId, updates) {
        try {
            const updateData = {};
            if (updates.email)
                updateData.email = updates.email;
            if (updates.name)
                updateData.name = updates.name;
            if (updates.metadata)
                updateData.metadata = updates.metadata;
            return await this.withRetry(() => this.stripe.customers.update(customerId, updateData), 'update_customer');
        }
        catch (error) {
            throw error;
        }
    }
    async deleteCustomer(customerId) {
        try {
            return await this.withRetry(() => this.stripe.customers.del(customerId), 'delete_customer');
        }
        catch (error) {
            throw error;
        }
    }
    async listCustomers(options = {}) {
        try {
            return await this.withRetry(() => this.stripe.customers.list(options), 'list_customers');
        }
        catch (error) {
            throw error;
        }
    }
    async searchCustomersByUserId(userId) {
        try {
            const customers = await this.withRetry(() => this.stripe.customers.search({
                query: `metadata["userId"]:"${userId}"`,
            }), 'search_customers');
            return customers.data;
        }
        catch (error) {
            throw error;
        }
    }
    async getCustomerPaymentMethods(customerId, type = 'card') {
        try {
            const paymentMethods = await this.withRetry(() => this.stripe.paymentMethods.list({
                customer: customerId,
                type: type,
            }), 'get_customer_payment_methods');
            return paymentMethods.data;
        }
        catch (error) {
            throw error;
        }
    }
    async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
        try {
            return await this.withRetry(() => this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            }), 'attach_payment_method');
        }
        catch (error) {
            throw error;
        }
    }
    async detachPaymentMethodFromCustomer(paymentMethodId) {
        try {
            return await this.withRetry(() => this.stripe.paymentMethods.detach(paymentMethodId), 'detach_payment_method');
        }
        catch (error) {
            throw error;
        }
    }
    async setDefaultPaymentMethod(customerId, paymentMethodId) {
        try {
            return await this.withRetry(() => this.stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            }), 'set_default_payment_method');
        }
        catch (error) {
            throw error;
        }
    }
}
//# sourceMappingURL=customer-management.service.js.map