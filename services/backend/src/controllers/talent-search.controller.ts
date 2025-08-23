// Talent Search Controller - HTTP Request/Response Layer

import { Request, Response } from 'express';
import type { 
  TalentSearchCriteria, 
  AdvancedSearchFilters,
  TalentSearchResponse 
} from '@/types/talent-search.types.js';
import { TalentSearchService, ITalentSearchService } from '@/services/talent-search.service.js';

export class TalentSearchController {
  private service: ITalentSearchService;

  constructor(service?: ITalentSearchService) {
    this.service = service || new TalentSearchService();
  }

  /**
   * Basic Talent Search
   * POST /api/talent/search
   */
  async searchTalent(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log("Controller: Talent search request received:", {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        userId: req.user?.id || 'anonymous'
      });

      const searchCriteria: TalentSearchCriteria = req.body;
      const userId = req.user?.id || 'test-user';

      // Validate request body
      if (!searchCriteria || Object.keys(searchCriteria).length === 0) {
        res.status(400).json({
          success: false,
          error: 'Missing search criteria',
          code: 'MISSING_CRITERIA',
          message: 'Search criteria is required'
        });
        return;
      }

      // Perform talent search
      const searchResult = await this.service.searchTalent(searchCriteria);
      
      const duration = Date.now() - startTime;
      
      const response: TalentSearchResponse = {
        success: true,
        data: searchResult,
        creditsRemaining: 100, // Mock for testing
        processingTime: duration
      };

      console.log("Controller: Talent search completed successfully:", {
        userId,
        profileCount: searchResult.profiles.length,
        totalCount: searchResult.totalCount,
        processingTime: duration
      });

      res.status(200).json(response);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error("Controller: Talent search failed:", {
        error: errorMessage,
        userId: req.user?.id || 'anonymous',
        duration
      });

      res.status(500).json({
        success: false,
        error: 'Talent search failed',
        code: 'TALENT_SEARCH_ERROR',
        message: errorMessage,
        processingTime: duration
      });
    }
  }

  /**
   * Advanced Talent Search
   * POST /api/talent/search/advanced
   */
  async advancedSearch(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log("Controller: Advanced talent search request received:", {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        userId: req.user?.id || 'anonymous'
      });

      const { criteria, filters } = req.body;
      const userId = req.user?.id || 'test-user';

      // Validate request body
      if (!criteria || Object.keys(criteria).length === 0) {
        res.status(400).json({
          success: false,
          error: 'Missing search criteria',
          code: 'MISSING_CRITERIA',
          message: 'Search criteria is required for advanced search'
        });
        return;
      }

      // Perform advanced talent search
      const searchResult = await this.service.advancedSearch(criteria, filters || {});
      
      const duration = Date.now() - startTime;
      
      const response: TalentSearchResponse = {
        success: true,
        data: searchResult,
        creditsRemaining: 100, // Mock for testing
        processingTime: duration
      };

      console.log("Controller: Advanced talent search completed successfully:", {
        userId,
        profileCount: searchResult.profiles.length,
        totalCount: searchResult.totalCount,
        processingTime: duration
      });

      res.status(200).json(response);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error("Controller: Advanced talent search failed:", {
        error: errorMessage,
        userId: req.user?.id || 'anonymous',
        duration
      });

      res.status(500).json({
        success: false,
        error: 'Advanced talent search failed',
        code: 'ADVANCED_SEARCH_ERROR',
        message: errorMessage,
        processingTime: duration
      });
    }
  }

  /**
   * Get Talent Profile by ID
   * GET /api/talent/profile/:profileId
   */
  async getProfileById(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { profileId } = req.params;
      const userId = req.user?.id || 'test-user';

      console.log("Controller: Get profile request received:", {
        profileId,
        userId
      });

      if (!profileId) {
        res.status(400).json({
          success: false,
          error: 'Missing profile ID',
          code: 'MISSING_PROFILE_ID',
          message: 'Profile ID is required'
        });
        return;
      }

      // Get profile by ID
      const profile = await this.service.getProfileById(profileId);
      
      const duration = Date.now() - startTime;
      
      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND',
          message: `Profile with ID ${profileId} not found`,
          processingTime: duration
        });
        return;
      }

      console.log("Controller: Profile retrieved successfully:", {
        profileId,
        userId,
        processingTime: duration
      });

      res.status(200).json({
        success: true,
        data: profile,
        processingTime: duration
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error("Controller: Get profile failed:", {
        error: errorMessage,
        profileId: req.params.profileId,
        userId: req.user?.id || 'anonymous',
        duration
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
        code: 'GET_PROFILE_ERROR',
        message: errorMessage,
        processingTime: duration
      });
    }
  }

  /**
   * Get Multiple Profiles by IDs
   * POST /api/talent/profiles
   */
  async getProfilesByIds(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { profileIds } = req.body;
      const userId = req.user?.id || 'test-user';

      console.log("Controller: Get multiple profiles request received:", {
        profileIds,
        userId
      });

      if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid profile IDs',
          code: 'INVALID_PROFILE_IDS',
          message: 'Profile IDs array is required'
        });
        return;
      }

      // Get profiles by IDs
      const profiles = await this.service.getProfilesByIds(profileIds);
      
      const duration = Date.now() - startTime;
      
      console.log("Controller: Multiple profiles retrieved successfully:", {
        requestedCount: profileIds.length,
        retrievedCount: profiles.length,
        userId,
        processingTime: duration
      });

      res.status(200).json({
        success: true,
        data: profiles,
        requestedCount: profileIds.length,
        retrievedCount: profiles.length,
        processingTime: duration
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error("Controller: Get multiple profiles failed:", {
        error: errorMessage,
        userId: req.user?.id || 'anonymous',
        duration
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get profiles',
        code: 'GET_PROFILES_ERROR',
        message: errorMessage,
        processingTime: duration
      });
    }
  }
}
