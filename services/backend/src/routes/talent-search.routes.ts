// Talent Search Routes - Clean and focused with async processing

import { Router } from "express";
import { TalentSearchController } from "@/controllers/talent-search.controller.js";

const router = Router();
const talentSearchController = new TalentSearchController();

/**
 * Async Talent Search - Returns job ID immediately
 * POST /api/talent/search
 */
router.post("/search", async (req, res) => {
  await talentSearchController.searchTalent(req, res);
});

/**
 * Async Advanced Talent Search - Returns job ID immediately
 * POST /api/talent/search/advanced
 */
router.post("/search/advanced", async (req, res) => {
  await talentSearchController.advancedSearch(req, res);
});

/**
 * Legacy Synchronous Search (for backward compatibility)
 * POST /api/talent/search/sync
 */
router.post("/search/sync", async (req, res) => {
  await talentSearchController.searchTalentSync(req, res);
});

/**
 * Get Job Status
 * GET /api/talent/jobs/:jobId/status
 */
router.get("/jobs/:jobId/status", async (req, res) => {
  await talentSearchController.getJobStatus(req, res);
});

/**
 * Get All Jobs (for monitoring)
 * GET /api/talent/jobs
 */
router.get("/jobs", async (req, res) => {
  await talentSearchController.getAllJobs(req, res);
});

/**
 * Get Talent Profile by ID
 * GET /api/talent/profile/:profileId
 */
router.get("/profile/:profileId", async (req, res) => {
  await talentSearchController.getProfileById(req, res);
});

/**
 * Get Multiple Profiles by IDs
 * POST /api/talent/profiles
 */
router.post("/profiles", async (req, res) => {
  await talentSearchController.getProfilesByIds(req, res);
});

export default router;
