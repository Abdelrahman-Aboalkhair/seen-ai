import { BasePaymentService } from './base-payment.service.js';
import type { CustomerData } from '@/types/payment.types.js';
export declare class CustomerManagementService extends BasePaymentService {
    createOrGetCustomer(customerData: CustomerData): Promise<any>;
    createOrGetCustomerByUserId(userId: string): Promise<any>;
    getCustomer(customerId: string): Promise<any>;
    updateCustomer(customerId: string, updates: Partial<CustomerData>): Promise<any>;
    deleteCustomer(customerId: string): Promise<any>;
    listCustomers(options?: {
        limit?: number;
        startingAfter?: string;
        endingBefore?: string;
        email?: string;
    }): Promise<any>;
    searchCustomersByUserId(userId: string): Promise<any[]>;
    getCustomerPaymentMethods(customerId: string, type?: string): Promise<any[]>;
    attachPaymentMethodToCustomer(paymentMethodId: string, customerId: string): Promise<any>;
    detachPaymentMethodFromCustomer(paymentMethodId: string): Promise<any>;
    setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<any>;
}
//# sourceMappingURL=customer-management.service.d.ts.map