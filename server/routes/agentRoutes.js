// routes/agentRoutes.js — DAB AI v6.0
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/agentController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Spec endpoints
router.get ('/agent/status',    ctrl.getStatus);     // GET /agent/status
router.get ('/agent/tasks',     ctrl.getTasks);      // GET /agent/tasks
router.get ('/agent/decisions', ctrl.getDecisions);  // GET /agent/decisions

// Extended endpoints
router.post('/agent/command',   ctrl.command);
router.get ('/agent/activity',  ctrl.activity);
router.get ('/agent/stats',     ctrl.stats);
router.post('/agent/tasks',     ctrl.createTask);
router.get ('/agent/logs',      ctrl.getLogs);

module.exports = router;
