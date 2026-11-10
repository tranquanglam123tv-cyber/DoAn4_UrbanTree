const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * 🤖 Gemini AI Routes
 * UrbanTree - Đồ án 4
 */

// Engine 1: TreeHealth AI
router.get('/trees/:id/health', aiController.getTreeHealthAssessment);

// Engine 2: ClimateMatch AI
router.post('/climate-match', aiController.getClimateMatchRecommendations);

// Engine 3: RiskPredict AI & Blockchain Anchor Guard
router.get('/trees/:id/risk', aiController.getTreeRiskPrediction);

// Engine 4: CareAdvisor AI
router.get('/trees/:id/care-plan', aiController.getTreeCarePlan);

// AI Assessment History
router.get('/trees/:id/history', aiController.getTreeAiHistory);

module.exports = router;

