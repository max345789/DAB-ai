// ─────────────────────────────────────────────────────────────
//  DAB AI – Campaign Routes  (Stage 3)
//  NOTE: /generate must be registered BEFORE /:id
// ─────────────────────────────────────────────────────────────
const express = require('express');
const {
  createCampaign,
  generateCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  ingestStats,
} = require('../controllers/campaignController');

const router = express.Router();

// Static routes first (avoid /:id collision)
router.post  ('/campaign/generate',    generateCampaign); // AI ad generator
router.post  ('/campaign',             createCampaign);
router.get   ('/campaigns',            getCampaigns);

// Dynamic /:id routes
router.get   ('/campaign/:id',         getCampaign);      // detail + ads + analytics
router.patch ('/campaign/:id',         updateCampaign);
router.post  ('/campaign/:id/stats',   ingestStats);      // daily stat ingest

module.exports = router;
