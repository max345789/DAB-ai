// routes/integrationRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/integrationController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Webhook endpoints are public (verified by token)
router.get('/integrations/whatsapp/webhook',  ctrl.whatsappWebhook);
router.post('/integrations/whatsapp/webhook', ctrl.whatsappWebhook);

// All other integration routes require auth
router.use(authMiddleware);

// Registry CRUD
router.get('/integrations',        ctrl.getIntegrations);
router.post('/integrations',       ctrl.createIntegration);
router.put('/integrations/:id',    ctrl.updateIntegration);
router.delete('/integrations/:id', ctrl.deleteIntegration);

// Spec: connect / disconnect
router.post('/integration/connect',    ctrl.connect);
router.post('/integration/disconnect', ctrl.disconnect);

// Meta Ads
router.post('/integrations/meta/sync/:campaignId', ctrl.syncMeta);

// Google Ads
router.post('/integrations/google/sync/:campaignId', ctrl.syncGoogle);

// WhatsApp
router.post('/integrations/whatsapp/send', ctrl.sendWhatsAppMsg);

// Email
router.post('/integrations/email/send', ctrl.sendEmailMsg);

// Calendar
router.post('/integrations/calendar/book',    ctrl.bookCalendarMeeting);
router.get('/integrations/calendar/upcoming', ctrl.getUpcomingMeetings);

module.exports = router;
