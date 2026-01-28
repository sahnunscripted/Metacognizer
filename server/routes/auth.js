import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Rate limit auth endpoints: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

function generateToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function userResponse(user, token) {
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  };
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, authProvider: 'local' });
    const token = generateToken(user);

    res.status(201).json(userResponse(user, token));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({ message: 'This account uses Google sign-in. Please use the Google button.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json(userResponse(user, token));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/google
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: 'Google OAuth is not configured' });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }]
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        await user.save();
      }
    } else {
      user = await User.create({
        email,
        name,
        googleId,
        authProvider: 'google'
      });
    }

    const token = generateToken(user);
    res.json(userResponse(user, token));
  } catch (error) {
    res.status(401).json({ message: 'Invalid Google credential' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
