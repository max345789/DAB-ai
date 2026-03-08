// ─────────────────────────────────────────────────────────────
//  DAB AI – Finance Routes  (Stage 4)
//  All routes prefixed with /api in index.js
// ─────────────────────────────────────────────────────────────
const express = require('express');
const {
  getFinanceSummary,
  getCampaignFinance,
  updateBudget,
  logExpense,
  logRevenue,
  getOptimizations,
  runOptimization,
  applyOptimization,
  triggerDailyUpdate,
} = require('../controllers/financeController');

const router = express.Router();

// ── Finance Summary ───────────────────────────────────────────
router.get  ('/finance/summary',                  getFinanceSummary);

// ── Campaign Finance ──────────────────────────────────────────
router.get  ('/campaign/:id/finance',             getCampaignFinance);
router.post ('/campaign/budget',                  updateBudget);

// ── Expense + Revenue Logging ─────────────────────────────────
router.post ('/finance/expense',                  logExpense);
router.post ('/finance/revenue',                  logRevenue);

// ── Optimization Engine ───────────────────────────────────────
router.get  ('/finance/optimizations',            getOptimizations);
router.post ('/finance/optimize',                 runOptimization);
router.post ('/finance/optimization/:id/apply',   applyOptimization);

// ── Manual job trigger ────────────────────────────────────────
router.post ('/finance/daily-update',             triggerDailyUpdate);

module.exports = router;
