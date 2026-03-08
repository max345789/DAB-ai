// ─────────────────────────────────────────────────────────────
//  DAB AI – Lead Routes  (Stage 2)
// ─────────────────────────────────────────────────────────────
const express = require('express');
const { createLead, getLeads, getLead, updateLead, rescoreLead }
  = require('../controllers/leadController');
const { getLeadFollowUps } = require('../controllers/followupController');
const { getLeadMeetings }  = require('../controllers/meetingController');

const router = express.Router();

router.post  ('/lead',           createLead);       // create + score + follow-up
router.get   ('/leads',          getLeads);          // list (filter by status/tier)
router.get   ('/lead/:id',       getLead);           // full lead + followups + meetings
router.patch ('/lead/:id',       updateLead);        // update fields
router.post  ('/lead/:id/rescore', rescoreLead);     // re-run AI scoring

// Nested resources
router.get   ('/lead/:id/followups', getLeadFollowUps);
router.get   ('/lead/:id/meetings',  getLeadMeetings);

module.exports = router;
