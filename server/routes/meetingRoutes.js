// ─────────────────────────────────────────────────────────────
//  DAB AI – Meeting Routes  (Stage 2)
// ─────────────────────────────────────────────────────────────
const express = require('express');
const {
  createMeeting,
  getMeetings,
  updateMeeting,
} = require('../controllers/meetingController');

const router = express.Router();

router.post  ('/meeting',     createMeeting);   // create (manual or auto-suggested)
router.get   ('/meetings',    getMeetings);      // list all (filter upcoming/status)
router.patch ('/meeting/:id', updateMeeting);    // confirm, cancel, update

module.exports = router;
