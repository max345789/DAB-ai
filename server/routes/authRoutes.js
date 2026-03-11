// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, forgot, reset, me } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot', forgot);
router.post('/auth/reset', reset);
router.get('/auth/me', authMiddleware, me);

module.exports = router;
