import { Router } from 'express';
import { TalentSearchService } from '@/services/talent/talent-search.service.js';
import supabaseService from '@/lib/supabase.js';
import { authenticate, requireCredits } from '@/middleware/auth.js';
import { generalRateLimit } from '@/middleware/rateLimiter.js';
import { commonValidations } from '@/middleware/validation.js';
import logger, { logError, logPerformance } from '@/lib/logger.js';
const router = Router();
const talentSearchService = new TalentSearchService();
router.use(authenticate);
router.use(generalRateLimit);
router.post('/search', requireCredits(2), ...commonValidations.talentSearch, async (req, res) => {
    const startTime = Date.now();
    try {
        const searchCriteria = req.body;
        const userId = req.user.id;
        logger.info('Talent search requested', {
            userId,
            criteria: searchCriteria
        });
        const searchResult = await talentSearchService.searchTalent(searchCriteria);
        const { data: user } = await supabaseService.getUser(userId);
        if (user) {
            const newCredits = user.credits - 2;
            await supabaseService.updateUserCredits(userId, newCredits);
            await supabaseService.createCreditTransaction(userId, -2, 'talent_search', `Talent search operation`);
        }
        const duration = Date.now() - startTime;
        logPerformance('talent_search_complete', duration, {
            userId,
            profileCount: searchResult.profiles.length,
            totalCount: searchResult.totalCount
        });
        res.json({
            success: true,
            data: searchResult,
            creditsRemaining: user ? user.credits - 2 : 0,
            processingTime: duration,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logError(error, {
            operation: 'talent_search_endpoint',
            userId: req.user.id,
            duration
        });
        res.status(500).json({
            success: false,
            error: 'Talent search failed',
            code: 'TALENT_SEARCH_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Search could not be completed',
        });
    }
});
router.post('/search/advanced', requireCredits(3), async (req, res) => {
    const startTime = Date.now();
    try {
        const { criteria, filters } = req.body;
        const userId = req.user.id;
        if (!criteria) {
            return res.status(400).json({
                success: false,
                error: 'Search criteria is required',
                code: 'MISSING_CRITERIA',
            });
        }
        logger.info('Advanced talent search requested', {
            userId,
            criteria,
            filters
        });
        const searchResult = await talentSearchService.advancedTalentSearch(criteria, filters);
        const { data: user } = await supabaseService.getUser(userId);
        if (user) {
            const newCredits = user.credits - 3;
            await supabaseService.updateUserCredits(userId, newCredits);
            await supabaseService.createCreditTransaction(userId, -3, 'advanced_talent_search', `Advanced talent search operation`);
        }
        const duration = Date.now() - startTime;
        logPerformance('advanced_talent_search_complete', duration, {
            userId,
            profileCount: searchResult.profiles.length,
            totalCount: searchResult.totalCount
        });
        res.json({
            success: true,
            data: searchResult,
            creditsRemaining: user ? user.credits - 3 : 0,
            processingTime: duration,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logError(error, {
            operation: 'advanced_talent_search_endpoint',
            userId: req.user.id,
            duration
        });
        res.status(500).json({
            success: false,
            error: 'Advanced talent search failed',
            code: 'ADVANCED_TALENT_SEARCH_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Advanced search could not be completed',
        });
    }
});
router.post('/search/batch', requireCredits(5), async (req, res) => {
    const startTime = Date.now();
    try {
        const { searches } = req.body;
        const userId = req.user.id;
        if (!Array.isArray(searches) || searches.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Searches array is required',
                code: 'MISSING_SEARCHES',
            });
        }
        if (searches.length > 5) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 5 searches per batch',
                code: 'BATCH_SIZE_EXCEEDED',
            });
        }
        const creditsRequired = searches.length * 2;
        if (req.user.credits < creditsRequired) {
            return res.status(402).json({
                success: false,
                error: 'Insufficient credits',
                code: 'INSUFFICIENT_CREDITS',
                required: creditsRequired,
                current: req.user.credits,
            });
        }
        logger.info('Batch talent search requested', {
            userId,
            batchSize: searches.length,
            creditsRequired
        });
        const results = await talentSearchService.batchTalentSearch(searches);
        const { data: user } = await supabaseService.getUser(userId);
        if (user) {
            const newCredits = user.credits - creditsRequired;
            await supabaseService.updateUserCredits(userId, newCredits);
            await supabaseService.createCreditTransaction(userId, -creditsRequired, 'batch_talent_search', `Batch talent search of ${searches.length} searches`);
        }
        const duration = Date.now() - startTime;
        logPerformance('batch_talent_search_complete', duration, {
            userId,
            batchSize: searches.length,
            successCount: results.length
        });
        res.json({
            success: true,
            data: results,
            creditsUsed: creditsRequired,
            creditsRemaining: user ? user.credits - creditsRequired : 0,
            processingTime: duration,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logError(error, {
            operation: 'batch_talent_search_endpoint',
            userId: req.user.id,
            duration
        });
        res.status(500).json({
            success: false,
            error: 'Batch talent search failed',
            code: 'BATCH_TALENT_SEARCH_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Batch search could not be completed',
        });
    }
});
router.get('/profile/:profileId', requireCredits(1), async (req, res) => {
    const startTime = Date.now();
    try {
        const { profileId } = req.params;
        const userId = req.user.id;
        logger.info('Talent profile requested', {
            userId,
            profileId
        });
        const profile = { id: profileId, message: 'Profile service not yet implemented' };
        const { data: user } = await supabaseService.getUser(userId);
        if (user) {
            const newCredits = user.credits - 1;
            await supabaseService.updateUserCredits(userId, newCredits);
            await supabaseService.createCreditTransaction(userId, -1, 'talent_profile', `Talent profile details for ${profileId}`);
        }
        const duration = Date.now() - startTime;
        logPerformance('talent_profile_complete', duration, {
            userId,
            profileId
        });
        res.json({
            success: true,
            data: profile,
            creditsRemaining: user ? user.credits - 1 : 0,
            processingTime: duration,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logError(error, {
            operation: 'talent_profile_endpoint',
            userId: req.user.id,
            profileId: req.params.profileId,
            duration
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get talent profile',
            code: 'TALENT_PROFILE_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Profile could not be retrieved',
        });
    }
});
router.post('/outreach/:profileId', requireCredits(1), async (req, res) => {
    const startTime = Date.now();
    try {
        const { profileId } = req.params;
        const { subject, content, templateId, personalizedFields } = req.body;
        const userId = req.user.id;
        if (!subject || !content) {
            return res.status(400).json({
                success: false,
                error: 'Subject and content are required',
                code: 'MISSING_MESSAGE_FIELDS',
            });
        }
        logger.info('Outreach message requested', {
            userId,
            profileId,
            templateId
        });
        const result = {
            messageId: `msg_${Date.now()}`,
            status: 'sent',
            message: 'Outreach service not yet implemented'
        };
        const { data: user } = await supabaseService.getUser(userId);
        if (user) {
            const newCredits = user.credits - 1;
            await supabaseService.updateUserCredits(userId, newCredits);
            await supabaseService.createCreditTransaction(userId, -1, 'talent_outreach', `Outreach message to talent ${profileId}`);
        }
        const duration = Date.now() - startTime;
        logPerformance('talent_outreach_complete', duration, {
            userId,
            profileId,
            messageId: result.messageId
        });
        res.json({
            success: true,
            data: result,
            creditsRemaining: user ? user.credits - 1 : 0,
            processingTime: duration,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logError(error, {
            operation: 'talent_outreach_endpoint',
            userId: req.user.id,
            profileId: req.params.profileId,
            duration
        });
        res.status(500).json({
            success: false,
            error: 'Failed to send outreach message',
            code: 'TALENT_OUTREACH_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Message could not be sent',
        });
    }
});
router.post('/workflow/trigger', requireCredits(2), async (req, res) => {
    const startTime = Date.now();
    try {
        const { workflowId, data, webhookUrl } = req.body;
        const userId = req.user.id;
        if (!workflowId || !data) {
            return res.status(400).json({
                success: false,
                error: 'Workflow ID and data are required',
                code: 'MISSING_WORKFLOW_FIELDS',
            });
        }
        logger.info('Workflow trigger requested', {
            userId,
            workflowId
        });
        const result = {
            executionId: `exec_${Date.now()}`,
            status: 'running',
            message: 'Workflow service not yet implemented'
        };
        const { data: user } = await supabaseService.getUser(userId);
        if (user) {
            const newCredits = user.credits - 2;
            await supabaseService.updateUserCredits(userId, newCredits);
            await supabaseService.createCreditTransaction(userId, -2, 'workflow_trigger', `Triggered workflow ${workflowId}`);
        }
        const duration = Date.now() - startTime;
        logPerformance('workflow_trigger_complete', duration, {
            userId,
            workflowId,
            executionId: result.executionId
        });
        res.json({
            success: true,
            data: result,
            creditsRemaining: user ? user.credits - 2 : 0,
            processingTime: duration,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logError(error, {
            operation: 'workflow_trigger_endpoint',
            userId: req.user.id,
            duration
        });
        res.status(500).json({
            success: false,
            error: 'Failed to trigger workflow',
            code: 'WORKFLOW_TRIGGER_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Workflow could not be triggered',
        });
    }
});
router.get('/workflow/status/:executionId', async (req, res) => {
    try {
        const { executionId } = req.params;
        const userId = req.user.id;
        logger.info('Workflow status requested', {
            userId,
            executionId
        });
        const status = {
            executionId,
            status: 'completed',
            message: 'Workflow status service not yet implemented'
        };
        res.json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        logError(error, {
            operation: 'workflow_status_endpoint',
            userId: req.user.id,
            executionId: req.params.executionId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow status',
            code: 'WORKFLOW_STATUS_ERROR',
        });
    }
});
router.post('/workflow/cancel/:executionId', async (req, res) => {
    try {
        const { executionId } = req.params;
        const userId = req.user.id;
        logger.info('Workflow cancellation requested', {
            userId,
            executionId
        });
        const success = true;
        if (success) {
            res.json({
                success: true,
                message: 'Workflow cancelled successfully',
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to cancel workflow',
                code: 'WORKFLOW_CANCEL_ERROR',
            });
        }
    }
    catch (error) {
        logError(error, {
            operation: 'workflow_cancel_endpoint',
            userId: req.user.id,
            executionId: req.params.executionId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to cancel workflow',
            code: 'WORKFLOW_CANCEL_ERROR',
        });
    }
});
router.get('/analytics', ...commonValidations.pagination, async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, jobTitle, location } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required',
                code: 'MISSING_DATE_RANGE',
            });
        }
        logger.info('Search analytics requested', {
            userId,
            startDate,
            endDate
        });
        const analytics = {
            totalSearches: 0,
            totalProfiles: 0,
            averageMatchScore: 0,
            topSkills: [],
            searchTrends: [],
            message: 'Analytics service not yet implemented'
        };
        res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        logError(error, {
            operation: 'search_analytics_endpoint',
            userId: req.user.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get search analytics',
            code: 'SEARCH_ANALYTICS_ERROR',
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const isHealthy = await talentSearchService.healthCheck();
        res.json({
            success: true,
            service: 'Talent Search',
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logError(error, { operation: 'talent_health_check' });
        res.status(503).json({
            success: false,
            service: 'Talent Search',
            status: 'error',
            error: 'Health check failed',
            timestamp: new Date().toISOString(),
        });
    }
});
export default router;
//# sourceMappingURL=talent.routes.js.map