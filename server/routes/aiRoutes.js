const express = require('express');

const { createRequest, getMetrics, getStatus, getTask, receiveResult } = require('../controllers/aiController');

const router = express.Router();

router.post('/ai/request', createRequest);
router.get('/ai/status', getStatus);
router.get('/ai/metrics', getMetrics);
router.get('/ai/task/:id', getTask);
router.post('/ai/result', receiveResult);

module.exports = router;
