// Talent Search Routes - Clean and focused

import { Router } from "express";
import { TalentSearchController } from "@/controllers/talent-search.controller.js";

const router = Router();
const talentSearchController = new TalentSearchController();

/**
 * Basic Talent Search
 * POST /api/talent/search
 */
router.post("/search", async (req, res) => {
  await talentSearchController.searchTalent(req, res);
});

/**
 * Advanced Talent Search
 * POST /api/talent/search/advanced
 */
router.post("/search/advanced", async (req, res) => {
  await talentSearchController.advancedSearch(req, res);
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
