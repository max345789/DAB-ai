// routes/automationRoutes.js — DAB AI v6.0
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/automationController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Rules CRUD
router.get   ('/automation/rules',        ctrl.getRules);
router.post  ('/automation/rule',         ctrl.createRule);   // spec: POST /automation/rule (singular)
router.post  ('/automation/rules',        ctrl.createRule);   // also accept plural
router.put   ('/automation/rules/:id',    ctrl.updateRule);
router.delete('/automation/rules/:id',    ctrl.deleteRule);

// History
router.get('/automation/history',         ctrl.getHistory);  // spec

// Manual trigger + test
router.post('/automation/trigger',        ctrl.triggerRule);
router.post('/automation/test',           ctrl.testRule);

module.exports = router;
