import { Router } from 'express';
import paymentService from '@/services/payment/payment.service.js';
import { authenticate, optionalAuthenticate } from '@/middleware/auth.js';
import { paymentRateLimit } from '@/middleware/rateLimiter.js';
import { commonValidations, validateSchema, schemas } from '@/middleware/validation.js';
import logger, { logError, logPerformance } from '@/lib/logger.js';
const router = Router();
router.use(paymentRateLimit);
router.post('/process', authenticate, ...commonValidations.payment, async (req, res) => {
    const startTime = Date.now();
    try {
        const { amount, currency, credits, description, paymentMethodId, metadata } = req.body;
        const userId = req.user.id;
        logger.info('Payment processing requested', {
            userId,
            amount,
            currency,
            credits,
            hasPaymentMethod: !!paymentMethodId
        });
        const paymentResult = await paymentService.payments.process({
            amount,
            currency,
            userId,
            description,
            credits,
            metadata,
            paymentMethodId,
        });
        const duration = Date.now() - startTime;
        logPerformance('payment_processing_complete', duration, {
            userId,
            paymentIntentId: paymentResult.paymentIntentId,
            status: paymentResult.status,
            amount
        });
        res.json({
            success: true,
            data: paymentResult,
            processingTime: duration,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logError(error, {
            operation: 'payment_processing_endpoint',
            userId: req.user.id,
            duration
        });
        res.status(500).json({
            success: false,
            error: 'Payment processing failed',
            code: 'PAYMENT_PROCESSING_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Payment could not be processed',
        });
    }
});
router.post('/refund', authenticate, validateSchema(schemas.refund), async (req, res) => {
    const startTime = Date.now();
    try {
        const { paymentIntentId, amount, reason } = req.body;
        const userId = req.user.id;
        logger.info('Refund processing requested', {
            userId,
            paymentIntentId,
            amount,
            reason
        });
        const refundResult = await paymentService.payments.refund({
            paymentIntentId,
            amount,
            reason,
            userId,
        });
        const duration = Date.now() - startTime;
        logPerformance('refund_processing_complete', duration, {
            userId,
            refundId: refundResult.refundId,
            status: refundResult.status,
            amount: refundResult.amount
        });
        res.json({
            success: true,
            data: refundResult,
            processingTime: duration,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logError(error, {
            operation: 'refund_processing_endpoint',
            userId: req.user.id,
            duration
        });
        res.status(500).json({
            success: false,
            error: 'Refund processing failed',
            code: 'REFUND_PROCESSING_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Refund could not be processed',
        });
    }
});
router.post('/setup-intent', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await paymentService.customers.createOrGetByUserId(userId);
        const setupIntent = await paymentService.payments.createSetupIntent(customer.id);
        logger.info('Setup intent created', {
            userId,
            customerId: customer.id,
            setupIntentId: setupIntent.id
        });
        res.json({
            success: true,
            data: {
                setupIntentId: setupIntent.id,
                clientSecret: setupIntent.client_secret,
                customerId: customer.id,
            },
        });
    }
    catch (error) {
        logError(error, {
            operation: 'setup_intent_endpoint',
            userId: req.user.id
        });
        res.status(500).json({
            success: false,
            error: 'Setup intent creation failed',
            code: 'SETUP_INTENT_ERROR',
        });
    }
});
router.get('/payment-methods', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await paymentService.customers.createOrGetByUserId(userId);
        const paymentMethods = await paymentService.payments.listPaymentMethods(customer.id);
        res.json({
            success: true,
            data: paymentMethods.map(pm => ({
                id: pm.id,
                type: pm.type,
                card: pm.card ? {
                    brand: pm.card.brand,
                    last4: pm.card.last4,
                    expMonth: pm.card.exp_month,
                    expYear: pm.card.exp_year,
                } : null,
                created: pm.created,
            })),
        });
    }
    catch (error) {
        logError(error, {
            operation: 'list_payment_methods_endpoint',
            userId: req.user.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to list payment methods',
            code: 'LIST_PAYMENT_METHODS_ERROR',
        });
    }
});
router.get('/status/:paymentIntentId', authenticate, async (req, res) => {
    try {
        const { paymentIntentId } = req.params;
        const userId = req.user.id;
        const paymentIntent = await paymentService.payments.getPaymentIntent(paymentIntentId);
        if (paymentIntent.metadata.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                code: 'ACCESS_DENIED',
            });
        }
        res.json({
            success: true,
            data: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                created: paymentIntent.created,
                credits: parseInt(paymentIntent.metadata.credits || '0'),
            },
        });
    }
    catch (error) {
        logError(error, {
            operation: 'payment_status_endpoint',
            userId: req.user.id,
            paymentIntentId: req.params.paymentIntentId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get payment status',
            code: 'PAYMENT_STATUS_ERROR',
        });
    }
});
router.post('/subscription', authenticate, async (req, res) => {
    try {
        const { priceId, metadata } = req.body;
        const userId = req.user.id;
        if (!priceId) {
            return res.status(400).json({
                success: false,
                error: 'Price ID is required',
                code: 'MISSING_PRICE_ID',
            });
        }
        logger.info('Subscription creation requested', {
            userId,
            priceId
        });
        const subscription = await paymentService.subscriptions.create({
            userId,
            priceId,
            metadata,
        });
        res.json({
            success: true,
            data: {
                subscriptionId: subscription.id,
                status: subscription.status,
                currentPeriodEnd: subscription.current_period_end,
                clientSecret: subscription.latest_invoice &&
                    typeof subscription.latest_invoice === 'object' &&
                    subscription.latest_invoice.payment_intent &&
                    typeof subscription.latest_invoice.payment_intent === 'object'
                    ? subscription.latest_invoice.payment_intent.client_secret
                    : null,
            },
        });
    }
    catch (error) {
        logError(error, {
            operation: 'create_subscription_endpoint',
            userId: req.user.id
        });
        res.status(500).json({
            success: false,
            error: 'Subscription creation failed',
            code: 'SUBSCRIPTION_CREATION_ERROR',
        });
    }
});
router.post('/subscription/:subscriptionId/cancel', authenticate, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const userId = req.user.id;
        logger.info('Subscription cancellation requested', {
            userId,
            subscriptionId
        });
        const subscription = await paymentService.subscriptions.cancel(subscriptionId);
        res.json({
            success: true,
            data: {
                subscriptionId: subscription.id,
                status: subscription.status,
                canceledAt: subscription.canceled_at,
            },
        });
    }
    catch (error) {
        logError(error, {
            operation: 'cancel_subscription_endpoint',
            userId: req.user.id,
            subscriptionId: req.params.subscriptionId
        });
        res.status(500).json({
            success: false,
            error: 'Subscription cancellation failed',
            code: 'SUBSCRIPTION_CANCELLATION_ERROR',
        });
    }
});
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing Stripe signature',
                code: 'MISSING_SIGNATURE',
            });
        }
        const webhookEvent = await paymentService.webhooks.handle(req.body, signature);
        if (webhookEvent) {
            logger.info('Webhook processed successfully', {
                eventType: webhookEvent.type,
                eventId: webhookEvent.id
            });
            res.json({
                success: true,
                received: true,
                eventId: webhookEvent.id,
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: 'Webhook processing failed',
                code: 'WEBHOOK_ERROR',
            });
        }
    }
    catch (error) {
        logError(error, { operation: 'stripe_webhook_endpoint' });
        res.status(400).json({
            success: false,
            error: 'Webhook processing failed',
            code: 'WEBHOOK_ERROR',
            message: error.message,
        });
    }
});
router.get('/history', authenticate, ...commonValidations.pagination, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        res.json({
            success: true,
            data: {
                payments: [],
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: 0,
                    pages: 0,
                },
            },
            message: 'Payment history endpoint - implement with proper payment tracking',
        });
    }
    catch (error) {
        logError(error, {
            operation: 'payment_history_endpoint',
            userId: req.user.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get payment history',
            code: 'PAYMENT_HISTORY_ERROR',
        });
    }
});
router.get('/health', optionalAuthenticate, async (req, res) => {
    try {
        const healthStatus = await paymentService.healthCheck();
        res.json({
            success: true,
            service: 'Payment Services',
            status: healthStatus.overall ? 'healthy' : 'unhealthy',
            services: healthStatus.services,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logError(error, { operation: 'payment_health_check' });
        res.status(503).json({
            success: false,
            service: 'Payment Services',
            status: 'error',
            error: 'Health check failed',
            timestamp: new Date().toISOString(),
        });
    }
});
export default router;
//# sourceMappingURL=payment.routes.js.map