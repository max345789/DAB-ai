const path = require('path');

const { supabaseAdmin } = require('../services/supabaseClient');
const logger = require('../services/loggerService');

async function ensureAvatarBucket() {
  try {
    // createBucket throws if already exists; ignore.
    await supabaseAdmin.storage.createBucket('avatars', { public: true });
  } catch (_e) {}
}

async function getProfile(req, res, next) {
  try {
    const userId = req.user.userId;

    // avatar_url may not exist depending on migration state
    let { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, createdat, avatar_url')
      .eq('id', userId)
      .single();

    if (error && /avatar_url/i.test(error.message || '')) {
      ({ data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, createdat')
        .eq('id', userId)
        .single());
    }

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    return res.json({ ...user, created_at: user.createdat });
  } catch (err) {
    next(err);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'avatar file is required' });

    await ensureAvatarBucket();

    const ext = path.extname(file.originalname || '') || '.png';
    const filename = `user-${userId}/${Date.now()}${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filename, file.buffer, {
        contentType: file.mimetype || 'image/png',
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(data.path);
    const avatarUrl = publicUrlData.publicUrl;

    // Store on user if column exists; otherwise return URL only.
    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (updateErr && /avatar_url/i.test(updateErr.message || '')) {
      logger.warn('PROFILE', 'users.avatar_url missing; avatar uploaded but not stored', { userId });
    } else if (updateErr) {
      throw updateErr;
    }

    logger.info('PROFILE', 'Avatar uploaded', { userId });
    return res.json({ success: true, avatar_url: avatarUrl });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  uploadAvatar,
};

