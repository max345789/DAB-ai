const express = require('express');

const { getSystemHealth, getSystemMetrics } = require('../controllers/systemController');

const router = express.Router();

router.get('/system/health', getSystemHealth);
router.get('/system/metrics', getSystemMetrics);

module.exports = router;
