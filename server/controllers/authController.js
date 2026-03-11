// controllers/authController.js — DAB AI v5.0
// POST /api/auth/register  POST /api/auth/login  GET /api/auth/me

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createHash, randomBytes } = require('crypto');
const { supabaseAdmin } = require('../services/supabaseClient');
const logger = require('../services/loggerService');
const { sendEmail } = require('../services/integrations/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'dab-ai-secret-change-in-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const RESET_TOKEN_TTL_MINS = Number(process.env.PASSWORD_RESET_TTL_MINS || 30);
const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL || process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email and password are required' });

    // Check existing
    const { data: existing } = await supabaseAdmin
      .from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({ name, email, password_hash, role })
      .select()
      .single();

    if (error) throw error;

    const token = signToken(user);
    logger.authEvent(user.id, 'REGISTER', req.ip);

    res.status(201).json({ token, user: { id: user.id, name, email, role } });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' });

    const { data: user, error } = await supabaseAdmin
      .from('users').select('*').eq('email', email).maybeSingle();

    if (error || !user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    logger.authEvent(user.id, 'LOGIN', req.ip);

    res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/forgot
// Generates a reset token (emailed if EMAIL_PROVIDER configured).
// In non-production, returns dev_reset_token for fast testing.
async function forgot(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .maybeSingle();

    // Always return success to avoid account enumeration.
    if (!user) return res.json({ success: true });

    const token = randomBytes(32).toString('hex');
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINS * 60_000).toISOString();
    const now = new Date().toISOString();

    await supabaseAdmin.from('password_resets').insert({
      user_id: user.id,
      token_hash: tokenHash,
      created_at: now,
      expires_at: expiresAt,
      used_at: null,
    });

    const resetUrl = `${APP_PUBLIC_URL.replace(/\/$/, '')}/reset-password?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your DAB AI password',
        text: `Reset link: ${resetUrl}`,
        html: `<p>Click to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch (err) {
      logger.warn('AUTH', 'Password reset email failed', { error: err.message });
    }

    logger.authEvent(user.id, 'FORGOT_PASSWORD', req.ip);

    // Dev helper
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ success: true, dev_reset_token: token, reset_url: resetUrl });
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset
// Body: { token, password }
async function reset(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'token and password are required' });

    const tokenHash = sha256(token);
    const { data: resetRow, error } = await supabaseAdmin
      .from('password_resets')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!resetRow) return res.status(400).json({ error: 'Invalid or expired reset token' });

    if (resetRow.expires_at && new Date(resetRow.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({ password_hash })
      .eq('id', resetRow.user_id);
    if (updateErr) throw updateErr;

    await supabaseAdmin
      .from('password_resets')
      .update({ used_at: now })
      .eq('id', resetRow.id);

    logger.authEvent(resetRow.user_id, 'RESET_PASSWORD', req.ip);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me  (requires auth)
async function me(req, res, next) {
  try {
    // Prefer avatar_url if the column exists; fall back cleanly if not.
    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role, createdat, avatar_url')
      .eq('id', req.user.userId);

    let { data: user, error } = await query.single();
    if (error && /avatar_url/i.test(error.message || '')) {
      ({ data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, createdat')
        .eq('id', req.user.userId)
        .single());
    }

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json({ ...user, created_at: user.createdat });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, forgot, reset, me };
