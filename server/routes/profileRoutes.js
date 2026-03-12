const express = require('express');
const multer = require('multer');

const { authMiddleware } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, uploadAvatar } = require('../controllers/profileController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.use(authMiddleware);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/profile/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;
