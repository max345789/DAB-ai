// ─────────────────────────────────────────────────────────────
//  DAB AI – Follow-Up Routes  (Stage 2)
// ─────────────────────────────────────────────────────────────
const express = require('express');
const {
  createFollowUp,
  getFollowUps,
  updateFollowUp,
} = require('../controllers/followupController');

const router = express.Router();

router.post  ('/followup',     createFollowUp);   // manual or AI-generated
router.get   ('/followups',    getFollowUps);      // list all (filter status/lead)
router.patch ('/followup/:id', updateFollowUp);    // cancel, reschedule, etc.

module.exports = router;
