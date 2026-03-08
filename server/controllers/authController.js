// controllers/authController.js — DAB AI v5.0
// POST /api/auth/register  POST /api/auth/login  GET /api/auth/me

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../services/supabaseClient');
const logger = require('../services/loggerService');

const JWT_SECRET = process.env.JWT_SECRET || 'dab-ai-secret-change-in-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
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

// GET /api/auth/me  (requires auth)
async function me(req, res, next) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users').select('id, name, email, role, createdat').eq('id', req.user.userId).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json({ ...user, created_at: user.createdat });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
