const path = require('path');

const { supabaseAdmin } = require('../services/supabaseClient');
const logger = require('../services/loggerService');

async function ensureAvatarBucket() {
  // If the server is running with only the anon key, we cannot manage buckets.
  // In that case we fail with a clear message.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Storage bucket setup requires SUPABASE_SERVICE_ROLE_KEY');
  }

  const bucketName = 'avatars';

  // Prefer an explicit existence check so we can fail loudly if Storage is disabled.
  try {
    const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets();
    if (listErr) throw listErr;
    if (Array.isArray(buckets) && buckets.some(b => b?.name === bucketName)) return;
  } catch (err) {
    logger.warn('PROFILE', 'Unable to list Supabase storage buckets', {
      error: err?.message || String(err),
    });
    // Continue and try to create the bucket; listing can be blocked in some setups.
  }

  const { error: createErr } = await supabaseAdmin.storage.createBucket(bucketName, { public: true });
  if (createErr && !/already exists/i.test(createErr.message || '')) {
    logger.error('PROFILE', 'Failed to create Supabase storage bucket', {
      bucket: bucketName,
      error: createErr.message || String(createErr),
    });
    throw new Error(`Supabase Storage bucket '${bucketName}' is missing and could not be created: ${createErr.message}`);
  }
}

async function getProfile(req, res, next) {
  try {
    const userId = req.user.userId;

    // avatar_url may not exist depending on migration state
    let { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, createdat, avatar_url, phone, dob, country, bio')
      .eq('id', userId)
      .single();

    if (error && /(avatar_url|phone|dob|country|bio)/i.test(error.message || '')) {
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

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const { name, phone, dob, country, bio } = req.body || {};

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (phone !== undefined) patch.phone = phone;
    if (dob !== undefined) patch.dob = dob;
    if (country !== undefined) patch.country = country;
    if (bio !== undefined) patch.bio = bio;
    patch.updatedat = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(patch)
      .eq('id', userId)
      .select('id, name, email, role, createdat, avatar_url, phone, dob, country, bio')
      .single();

    if (error) throw error;
    return res.json({ success: true, profile: { ...data, created_at: data.createdat } });
  } catch (err) {
    next(err);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'avatar file is required' });

    try {
      await ensureAvatarBucket();
    } catch (e) {
      return res.status(500).json({
        error: 'Avatar storage is not configured',
        detail:
          e instanceof Error
            ? e.message
            : 'Supabase Storage bucket "avatars" must exist and be public.',
        action:
          'In Supabase Dashboard → Storage, create a PUBLIC bucket named "avatars", then retry.',
      });
    }

    const ext = path.extname(file.originalname || '') || '.png';
    const filename = `user-${userId}/${Date.now()}${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filename, file.buffer, {
        contentType: file.mimetype || 'image/png',
        upsert: true,
      });

    if (error) {
      if (/bucket/i.test(error.message || '') && /not found/i.test(error.message || '')) {
        return res.status(500).json({
          error: 'Avatar bucket not found',
          detail: error.message,
          action: 'Create a PUBLIC Supabase Storage bucket named "avatars" and retry.',
        });
      }
      throw error;
    }

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
  updateProfile,
  uploadAvatar,
};
