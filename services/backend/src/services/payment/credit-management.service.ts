import { BasePaymentService } from './base-payment.service.js';
import supabaseService from '@/lib/supabase.js';
import logger, { logError } from '@/lib/logger.js';

export class CreditManagementService extends BasePaymentService {

  // Handle successful payment by adding credits
  async handleSuccessfulPayment(userId: string, credits: number, paymentIntentId: string): Promise<void> {
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

  // Handle refund by deducting credits
  async handleRefundCredits(userId: string, paymentIntentId: string, refundAmount: number): Promise<void> {
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

  // Calculate credits for amount
  calculateCreditsForAmount(amount: number, currency: string = 'usd'): number {
    // Credit calculation logic - can be customized based on pricing
    const creditRates: Record<string, number> = {
      'usd': 100, // $1.00 = 1 credit (amount is in cents)
      'eur': 110, // €1.00 = 1 credit (adjusted for currency)
    };

    const rate = creditRates[currency.toLowerCase()] || creditRates['usd'];
    return Math.floor(amount / rate);
  }

  // Calculate amount for credits
  calculateAmountForCredits(credits: number, currency: string = 'usd'): number {
    const creditRates: Record<string, number> = {
      'usd': 100, // 1 credit = $1.00 (in cents)
      'eur': 110, // 1 credit = €1.10 (in cents)
    };

    const rate = creditRates[currency.toLowerCase()] || creditRates['usd'];
    return credits * rate;
  }

  // Validate credit transaction
  async validateCreditTransaction(userId: string, creditsRequired: number): Promise<{
    valid: boolean;
    currentCredits: number;
    message?: string;
  }> {
    try {
      const { data: user, error } = await supabaseService.getUser(userId);
      
      if (error || !user) {
        return {
          valid: false,
          currentCredits: 0,
          message: 'User not found'
        };
      }

      if (user.credits < creditsRequired) {
        return {
          valid: false,
          currentCredits: user.credits,
          message: `Insufficient credits. Required: ${creditsRequired}, Available: ${user.credits}`
        };
      }

      return {
        valid: true,
        currentCredits: user.credits
      };
    } catch (error) {
      logError(error as Error, { operation: 'validate_credit_transaction', userId, creditsRequired });
      return {
        valid: false,
        currentCredits: 0,
        message: 'Validation failed'
      };
    }
  }

  // Deduct credits for operation
  async deductCredits(userId: string, credits: number, operation: string): Promise<{
    success: boolean;
    newBalance: number;
    transactionId?: string;
  }> {
    try {
      // Validate transaction
      const validation = await this.validateCreditTransaction(userId, credits);
      if (!validation.valid) {
        return {
          success: false,
          newBalance: validation.currentCredits
        };
      }

      // Deduct credits
      const newCredits = validation.currentCredits - credits;
      const { error: updateError } = await supabaseService.updateUserCredits(userId, newCredits);
      
      if (updateError) {
        throw updateError;
      }

      // Create transaction record
      const { data: transaction } = await supabaseService.createCreditTransaction(
        userId,
        -credits,
        'deduction',
        `Credits deducted for ${operation}`
      );

      logger.info('Credits deducted successfully', { 
        userId, 
        creditsDeducted: credits, 
        newBalance: newCredits,
        operation 
      });

      return {
        success: true,
        newBalance: newCredits,
        transactionId: transaction?.id
      };
    } catch (error) {
      logError(error as Error, { operation: 'deduct_credits', userId, credits });
      throw error;
    }
  }

  // Add credits (for admin or promotional purposes)
  async addCredits(userId: string, credits: number, reason: string): Promise<{
    success: boolean;
    newBalance: number;
    transactionId?: string;
  }> {
    try {
      const { data: user, error: userError } = await supabaseService.getUser(userId);
      if (userError || !user) {
        throw new Error('User not found');
      }

      // Add credits
      const newCredits = user.credits + credits;
      const { error: updateError } = await supabaseService.updateUserCredits(userId, newCredits);
      
      if (updateError) {
        throw updateError;
      }

      // Create transaction record
      const { data: transaction } = await supabaseService.createCreditTransaction(
        userId,
        credits,
        'addition',
        reason
      );

      logger.info('Credits added successfully', { 
        userId, 
        creditsAdded: credits, 
        newBalance: newCredits,
        reason 
      });

      return {
        success: true,
        newBalance: newCredits,
        transactionId: transaction?.id
      };
    } catch (error) {
      logError(error as Error, { operation: 'add_credits', userId, credits });
      throw error;
    }
  }

  // Get credit balance
  async getCreditBalance(userId: string): Promise<number> {
    try {
      const { data: user, error } = await supabaseService.getUser(userId);
      if (error || !user) {
        throw new Error('User not found');
      }

      return user.credits;
    } catch (error) {
      logError(error as Error, { operation: 'get_credit_balance', userId });
      throw error;
    }
  }
}
