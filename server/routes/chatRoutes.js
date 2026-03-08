// ─────────────────────────────────────────────────────────────
//  DAB AI – Chat Routes
// ─────────────────────────────────────────────────────────────
const express = require('express');
const { chat, getChatHistory } = require('../controllers/chatController');

const router = express.Router();

// POST /api/chat       – send a message to the AI agent
router.post('/chat', chat);

// GET  /api/chat/history – retrieve conversation history
router.get('/chat/history', getChatHistory);

module.exports = router;
