import { Router, Request, Response } from 'express';
import { TalentSearchService } from '@/services/talent/talent-search.service.js';
import supabaseService from '@/lib/supabase.js';
import { authenticate, requireCredits } from '@/middleware/auth.js';
import { generalRateLimit } from '@/middleware/rateLimiter.js';
import { commonValidations, validateSchema, schemas } from '@/middleware/validation.js';
import logger, { logError, logPerformance } from '@/lib/logger.js';

const router = Router();
const talentSearchService = new TalentSearchService();

// Apply authentication and rate limiting to all talent routes
router.use(authenticate);
router.use(generalRateLimit);

/**
 * Talent Search Endpoint
 * POST /api/talent/search
 */
router.post('/search',
  requireCredits(2), // Talent search costs 2 credits
  ...commonValidations.talentSearch,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const searchCriteria = req.body;
      const userId = req.user!.id;
      
      logger.info('Talent search requested', { 
        userId, 
        criteria: searchCriteria 
      });
      
      // Perform talent search using talent service
      const searchResult = await talentSearchService.searchTalent(searchCriteria);
      
      // Deduct credits from user account
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - 2;
        await supabaseService.updateUserCredits(userId, newCredits);
        
        // Create credit transaction record
        await supabaseService.createCreditTransaction(
          userId,
          -2,
          'talent_search',
          `Talent search operation`
        );
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
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, { 
        operation: 'talent_search_endpoint', 
        userId: req.user!.id,
        duration 
      });
      
      res.status(500).json({
        success: false,
        error: 'Talent search failed',
        code: 'TALENT_SEARCH_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Search could not be completed',
      });
    }
  }
);

/**
 * Advanced Talent Search Endpoint
 * POST /api/talent/search/advanced
 */
router.post('/search/advanced',
  requireCredits(3), // Advanced search costs 3 credits
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { criteria, filters } = req.body;
      const userId = req.user!.id;
      
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
      
      // Perform advanced talent search
      const searchResult = await talentSearchService.advancedTalentSearch(criteria, filters);
      
      // Deduct credits
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - 3;
        await supabaseService.updateUserCredits(userId, newCredits);
        
        await supabaseService.createCreditTransaction(
          userId,
          -3,
          'advanced_talent_search',
          `Advanced talent search operation`
        );
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
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, { 
        operation: 'advanced_talent_search_endpoint', 
        userId: req.user!.id,
        duration 
      });
      
      res.status(500).json({
        success: false,
        error: 'Advanced talent search failed',
        code: 'ADVANCED_TALENT_SEARCH_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Advanced search could not be completed',
      });
    }
  }
);

/**
 * Batch Talent Search Endpoint
 * POST /api/talent/search/batch
 */
router.post('/search/batch',
  requireCredits(5), // Minimum 5 credits for batch operations
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { searches } = req.body;
      const userId = req.user!.id;
      
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
      if (req.user!.credits < creditsRequired) {
        return res.status(402).json({
          success: false,
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          required: creditsRequired,
          current: req.user!.credits,
        });
      }
      
      logger.info('Batch talent search requested', { 
        userId, 
        batchSize: searches.length,
        creditsRequired 
      });
      
      // Process batch talent searches
      const results = await talentSearchService.batchTalentSearch(searches);
      
      // Deduct credits
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - creditsRequired;
        await supabaseService.updateUserCredits(userId, newCredits);
        
        await supabaseService.createCreditTransaction(
          userId,
          -creditsRequired,
          'batch_talent_search',
          `Batch talent search of ${searches.length} searches`
        );
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
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, { 
        operation: 'batch_talent_search_endpoint', 
        userId: req.user!.id,
        duration 
      });
      
      res.status(500).json({
        success: false,
        error: 'Batch talent search failed',
        code: 'BATCH_TALENT_SEARCH_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Batch search could not be completed',
      });
    }
  }
);

/**
 * Get Talent Profile Details
 * GET /api/talent/profile/:profileId
 */
router.get('/profile/:profileId',
  requireCredits(1), // Profile details cost 1 credit
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { profileId } = req.params;
      const userId = req.user!.id;
      
      logger.info('Talent profile requested', { 
        userId, 
        profileId 
      });
      
      // Get talent profile details (placeholder implementation)
      const profile = { id: profileId, message: 'Profile service not yet implemented' };
      
      // Deduct credits
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - 1;
        await supabaseService.updateUserCredits(userId, newCredits);
        
        await supabaseService.createCreditTransaction(
          userId,
          -1,
          'talent_profile',
          `Talent profile details for ${profileId}`
        );
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
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, { 
        operation: 'talent_profile_endpoint', 
        userId: req.user!.id,
        profileId: req.params.profileId,
        duration 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to get talent profile',
        code: 'TALENT_PROFILE_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Profile could not be retrieved',
      });
    }
  }
);

/**
 * Send Outreach Message
 * POST /api/talent/outreach/:profileId
 */
router.post('/outreach/:profileId',
  requireCredits(1), // Outreach message costs 1 credit
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { profileId } = req.params;
      const { subject, content, templateId, personalizedFields } = req.body;
      const userId = req.user!.id;
      
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
      
      // Send outreach message (placeholder implementation)
      const result = { 
        messageId: `msg_${Date.now()}`,
        status: 'sent',
        message: 'Outreach service not yet implemented'
      };
      
      // Deduct credits
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - 1;
        await supabaseService.updateUserCredits(userId, newCredits);
        
        await supabaseService.createCreditTransaction(
          userId,
          -1,
          'talent_outreach',
          `Outreach message to talent ${profileId}`
        );
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
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, { 
        operation: 'talent_outreach_endpoint', 
        userId: req.user!.id,
        profileId: req.params.profileId,
        duration 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to send outreach message',
        code: 'TALENT_OUTREACH_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Message could not be sent',
      });
    }
  }
);

/**
 * Trigger Custom Workflow
 * POST /api/talent/workflow/trigger
 */
router.post('/workflow/trigger',
  requireCredits(2), // Workflow trigger costs 2 credits
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { workflowId, data, webhookUrl } = req.body;
      const userId = req.user!.id;
      
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
      
      // Trigger workflow (placeholder implementation)
      const result = {
        executionId: `exec_${Date.now()}`,
        status: 'running' as const,
        message: 'Workflow service not yet implemented'
      };
      
      // Deduct credits
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - 2;
        await supabaseService.updateUserCredits(userId, newCredits);
        
        await supabaseService.createCreditTransaction(
          userId,
          -2,
          'workflow_trigger',
          `Triggered workflow ${workflowId}`
        );
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
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, { 
        operation: 'workflow_trigger_endpoint', 
        userId: req.user!.id,
        duration 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to trigger workflow',
        code: 'WORKFLOW_TRIGGER_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Workflow could not be triggered',
      });
    }
  }
);

/**
 * Get Workflow Status
 * GET /api/talent/workflow/status/:executionId
 */
router.get('/workflow/status/:executionId',
  async (req: Request, res: Response) => {
    try {
      const { executionId } = req.params;
      const userId = req.user!.id;
      
      logger.info('Workflow status requested', { 
        userId, 
        executionId 
      });
      
      // Get workflow status (placeholder implementation)
      const status = {
        executionId,
        status: 'completed' as const,
        message: 'Workflow status service not yet implemented'
      };
      
      res.json({
        success: true,
        data: status,
      });
      
    } catch (error) {
      logError(error as Error, { 
        operation: 'workflow_status_endpoint', 
        userId: req.user!.id,
        executionId: req.params.executionId 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to get workflow status',
        code: 'WORKFLOW_STATUS_ERROR',
      });
    }
  }
);

/**
 * Cancel Workflow
 * POST /api/talent/workflow/cancel/:executionId
 */
router.post('/workflow/cancel/:executionId',
  async (req: Request, res: Response) => {
    try {
      const { executionId } = req.params;
      const userId = req.user!.id;
      
      logger.info('Workflow cancellation requested', { 
        userId, 
        executionId 
      });
      
      // Cancel workflow (placeholder implementation)
      const success = true;
      
      if (success) {
        res.json({
          success: true,
          message: 'Workflow cancelled successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to cancel workflow',
          code: 'WORKFLOW_CANCEL_ERROR',
        });
      }
      
    } catch (error) {
      logError(error as Error, { 
        operation: 'workflow_cancel_endpoint', 
        userId: req.user!.id,
        executionId: req.params.executionId 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to cancel workflow',
        code: 'WORKFLOW_CANCEL_ERROR',
      });
    }
  }
);

/**
 * Get Search Analytics
 * GET /api/talent/analytics
 */
router.get('/analytics',
  ...commonValidations.pagination,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
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
      
      // Get search analytics (placeholder implementation)
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
      
    } catch (error) {
      logError(error as Error, { 
        operation: 'search_analytics_endpoint', 
        userId: req.user!.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to get search analytics',
        code: 'SEARCH_ANALYTICS_ERROR',
      });
    }
  }
);

/**
 * Talent Service Health Check
 * GET /api/talent/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await talentSearchService.healthCheck();
    
    res.json({
      success: true,
      service: 'Talent Search',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error as Error, { operation: 'talent_health_check' });
    
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
