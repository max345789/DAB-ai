// routes/reportsRoutes.js — DAB AI v6.0
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reportsController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/reports/daily     — rolling daily summary (?days=30)
// GET /api/reports/campaign  — per-campaign performance (?id=&status=&platform=&limit=50)
// GET /api/reports/leads     — lead pipeline report (?days=30)
router.get('/reports/daily',    ctrl.getDaily);
router.get('/reports/campaign', ctrl.getCampaign);
router.get('/reports/leads',    ctrl.getLeads);

module.exports = router;
