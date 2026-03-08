// routes/dashboardRoutes.js — DAB AI v6.0
const express = require('express');
const router  = express.Router();
const { getSummary, getCharts, getActivity, getDashboard } = require('../controllers/dashboardController');

// Spec endpoints
router.get('/dashboard/summary',  getSummary);
router.get('/dashboard/charts',   getCharts);
router.get('/dashboard/activity', getActivity);

// Legacy endpoint (backward compat)
router.get('/dashboard', getDashboard);

module.exports = router;
