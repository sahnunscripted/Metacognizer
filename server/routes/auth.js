import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Action from '../models/Action.js';
import Project from '../models/Project.js';
import BraindumpItem from '../models/BraindumpItem.js';
import InbasketItem from '../models/InbasketItem.js';
import SomedayItem from '../models/SomedayItem.js';
import RecurringAction from '../models/RecurringAction.js';
import UserStats from '../models/UserStats.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Password validation for new accounts (not applied to login)
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) {
    errors.push('at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('a number');
  }
  return errors;
}

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        message: `Password must contain ${passwordErrors.join(', ')}`
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ email, password, authProvider: 'local' });
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

// GET /api/auth/config (public - returns what auth methods are available)
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null
  });
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

// GET /api/auth/export-data (GDPR - Right to Access/Portability)
router.get('/export-data', auth, async (req, res) => {
  try {
    const [user, actions, projects, braindumps, inbasket, someday, recurring, stats] = await Promise.all([
      User.findById(req.userId).select('-password'),
      Action.find({ userId: req.userId }),
      Project.find({ userId: req.userId }),
      BraindumpItem.find({ userId: req.userId }),
      InbasketItem.find({ userId: req.userId }),
      SomedayItem.find({ userId: req.userId }),
      RecurringAction.find({ userId: req.userId }),
      UserStats.findOne({ userId: req.userId })
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      actions,
      projects,
      braindumpItems: braindumps,
      inbasketItems: inbasket,
      somedayItems: someday,
      recurringActions: recurring,
      stats: stats ? {
        totalPoints: stats.totalPoints,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalActionsCompleted: stats.totalActionsCompleted,
        achievements: stats.achievements
      } : null
    };

    res.setHeader('Content-Disposition', 'attachment; filename=metacognizer-data-export.json');
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/auth/delete-account (GDPR - Right to Erasure)
router.delete('/delete-account', auth, async (req, res) => {
  try {
    // Delete all user data from all collections
    await Promise.all([
      Action.deleteMany({ userId: req.userId }),
      Project.deleteMany({ userId: req.userId }),
      BraindumpItem.deleteMany({ userId: req.userId }),
      InbasketItem.deleteMany({ userId: req.userId }),
      SomedayItem.deleteMany({ userId: req.userId }),
      RecurringAction.deleteMany({ userId: req.userId }),
      UserStats.deleteMany({ userId: req.userId }),
      User.findByIdAndDelete(req.userId)
    ]);

    res.json({ message: 'Account and all data permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
