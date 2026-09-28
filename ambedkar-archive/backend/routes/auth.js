const crypto = require('crypto');
const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const cryptoUtil = require('../utils/cryptoUtil');
const userService = require('../services/userService');
const OtpVerification = require('../models/OtpVerification');
const emailOtpService = require('../services/emailOtpService');
const whatsappOtpService = require('../services/whatsappOtpService');
const telegramOtpService = require('../services/telegramOtpService');
const passwordPolicy = require('../utils/passwordPolicy');
const PasswordReset = require('../models/PasswordReset');
const { signToken } = require('../config/jwt');
const { protect } = require('../middleware/auth');

const router = express.Router();

// In-memory fallback for password reset tokens when database is offline
const passwordResetMemoryStore = new Map();

// Initialize Google OAuth2 Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Re-use isDbConnected from userService — no need to duplicate
const { isDbConnected } = userService;

/**
 * Cryptographically verify a Google GIS ID Token using Google's public keys
 * @param {string} idToken
 * @returns {Promise<object>} verified token payload
 */
async function verifyGoogleToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId && process.env.NODE_ENV === 'production') {
    throw new Error('Google Sign-In is not configured on this server (missing GOOGLE_CLIENT_ID).');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: clientId || undefined,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.sub) {
    throw new Error('Malformed or incomplete Google token payload.');
  }

  const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
  if (payload.iss && !validIssuers.includes(payload.iss)) {
    throw new Error('Invalid Google token issuer.');
  }

  return payload;
}

// Rate limit: max 30 auth requests per 15 minutes per IP in prod (higher in dev/test)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 500,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/auth/config — Public auth configuration for frontend GIS integration
router.get('/config', (req, res) => {
  res.json({
    success: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID || '782338228221-an7aut37hhgl908gi18tqro637g57eir.apps.googleusercontent.com',
  });
});

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.')
      .custom((value) => {
        const check = passwordPolicy.validatePasswordStrength(value);
        if (!check.valid) {
          throw new Error(check.message);
        }
        return true;
      }),
    body('phone').optional().trim().matches(/^[0-9+ ]{0,20}$/).withMessage('Invalid phone number format'),
    body('language').optional().isIn(['en', 'hi', 'mr']).withMessage('Language must be en, hi, or mr'),
    body('institution').optional().trim().isLength({ max: 200 }).withMessage('Institution max 200 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, password, phone, language, institution } = req.body;

      const existing = await userService.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const user = await userService.createUser({
        name,
        email,
        phone: phone || '',
        password,
        language: language || 'en',
        institution: institution || '',
        role: 'visitor', // strictly enforce visitor; prevent privilege escalation
      });

      const token = signToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          language: user.language,
          institution: user.institution,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const email = req.body.email.toLowerCase().trim();
      const user = await userService.findByEmail(email);

      // SECURITY: Generic response to prevent email enumeration attacks
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account exists with this email, password reset instructions have been dispatched.',
        });
      }

      // Generate 6-digit cryptographically secure reset token
      const resetCode = (100000 + crypto.randomInt(0, 900000)).toString();
      const tokenHash = cryptoUtil.sha256(resetCode);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      if (isDbConnected()) {
        try {
          await PasswordReset.deleteMany({ email });
          await PasswordReset.create({ email, tokenHash, expiresAt });
        } catch (e) {
          // fallback
        }
      }
      passwordResetMemoryStore.set(email, { tokenHash, expiresAt: expiresAt.getTime(), used: false });

      // Dispatch reset email
      try {
        await emailOtpService.sendEmailOtp(email, resetCode);
      } catch (e) {
        console.warn('Could not dispatch password reset email:', e.message);
      }

      const isDev = process.env.NODE_ENV !== 'production' || process.env.DEV_AUTH_MODE === 'true';

      res.json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been dispatched.',
        demoCode: isDev ? resetCode : undefined,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body().custom((value, { req }) => {
      const resetToken = (req.body && (req.body.token || req.body.code)) || '';
      if (!resetToken || typeof resetToken !== 'string' || !resetToken.trim()) {
        throw new Error('Verification code / reset token is required.');
      }
      return true;
    }),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.')
      .custom((value) => {
        const check = passwordPolicy.validatePasswordStrength(value);
        if (!check.valid) {
          throw new Error(check.message);
        }
        return true;
      }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, newPassword } = req.body;
      const token = ((req.body.token || req.body.code) || '').trim();
      const cleanEmail = email.toLowerCase().trim();

      // Retrieve reset record
      let resetRecord = null;
      if (isDbConnected()) {
        try {
          resetRecord = await PasswordReset.findOne({ email: cleanEmail, used: false, expiresAt: { $gt: new Date() } });
        } catch (e) {
          // fallback
        }
      }
      if (!resetRecord) {
        const mem = passwordResetMemoryStore.get(cleanEmail);
        if (mem && !mem.used && mem.expiresAt > Date.now()) {
          resetRecord = mem;
        }
      }

      if (!resetRecord) {
        return res.status(400).json({ success: false, message: 'Invalid or expired password reset code. Please request a new one.' });
      }

      // Constant-time token verification
      const candidateHash = cryptoUtil.sha256(token.trim());
      const isValid = cryptoUtil.timingSafeEqualStr(resetRecord.tokenHash, candidateHash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid password reset code. Please try again.' });
      }

      // Mark token used / delete
      if (isDbConnected() && resetRecord.save) {
        resetRecord.used = true;
        await resetRecord.save();
      }
      passwordResetMemoryStore.delete(cleanEmail);

      // Update password (hashed with Bcrypt 12 rounds + SHA-256 pre-hash)
      const updated = await userService.updatePassword(cleanEmail, newPassword);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }

      res.json({
        success: true,
        message: 'Password has been successfully updated. You may now log in with your new password.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().notEmpty().withMessage('Email or phone number is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;
      const identifier = (email || '').trim();

      // Check by email or phone number
      let user = null;
      if (identifier.includes('@')) {
        user = await userService.findByEmail(identifier, true);
      } else {
        user = await userService.findByPhone(identifier, true);
      }
      if (!user) {
        user = (await userService.findByEmail(identifier, true)) || (await userService.findByPhone(identifier, true));
      }

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email/phone or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
      }

      if (typeof user.updateActivity === 'function') {
        await user.updateActivity();
      }
      const token = signToken(user._id);

      res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          language: user.language,
          institution: user.institution,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/google
router.post('/google', authLimiter, async (req, res, next) => {
  try {
    const { credential, accessToken, email: bodyEmail, name: bodyName, googleId: bodyGoogleId, picture: bodyPicture } = req.body;

    let email, name, picture, googleId;

    if (credential && typeof credential === 'string') {
      try {
        const payload = await verifyGoogleToken(credential);
        email = payload.email.trim().toLowerCase();
        name = (payload.name || email.split('@')[0]).trim();
        picture = payload.picture || '';
        googleId = payload.sub;
      } catch (authErr) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired Google ID token verification failed.',
        });
      }
    } else if (accessToken && typeof accessToken === 'string') {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!userInfoRes.ok) {
          return res.status(401).json({ success: false, message: 'Google authorization expired or invalid.' });
        }
        const profile = await userInfoRes.json();
        if (!profile.email) {
          return res.status(400).json({ success: false, message: 'Google account did not return an email address.' });
        }
        email = profile.email.trim().toLowerCase();
        name = (profile.name || email.split('@')[0]).trim();
        picture = profile.picture || '';
        googleId = profile.sub;
      } catch (tokenErr) {
        return res.status(500).json({ success: false, message: 'Failed to verify Google access token.' });
      }
    } else if (bodyEmail && typeof bodyEmail === 'string' && bodyEmail.includes('@')) {
      const hasGoogleConfig = !!process.env.GOOGLE_CLIENT_ID;
      // In production with GOOGLE_CLIENT_ID configured, enforce real cryptographic ID token or access token
      if (process.env.NODE_ENV === 'production' && hasGoogleConfig && process.env.DEV_AUTH_MODE !== 'true') {
        return res.status(403).json({
          success: false,
          message: 'Unverified Google sign-in is disabled in production. A valid Google ID token credential is required.',
        });
      }

      // When GOOGLE_CLIENT_ID is unconfigured or in development mode, only permit pre-configured safe demo accounts
      const safeDemoEmails = ['researcher@ambedkar-archive.in', 'admin@ambedkar-archive.in', 'visitor@ambedkar-archive.in'];
      const normalizedEmail = bodyEmail.trim().toLowerCase();
      if (!safeDemoEmails.includes(normalizedEmail)) {
        return res.status(403).json({
          success: false,
          message: hasGoogleConfig
            ? 'Development demo login is restricted to pre-configured demo test accounts.'
            : 'Google Client ID is not configured in this environment. Please select a verified demo account (Researcher, Admin, Visitor).',
        });
      }

      email = normalizedEmail;
      name = (bodyName || email.split('@')[0]).trim();
      picture = bodyPicture || '';
      googleId = bodyGoogleId || 'g_' + crypto.randomBytes(8).toString('hex');
    } else {
      return res.status(400).json({
        success: false,
        message: 'A valid Google ID token credential or access token is required.',
      });
    }

    let user = await userService.findByEmail(email);

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
      }
      if (picture && !user.avatar) {
        await userService.updateUser(user._id, { avatar: picture });
        user.avatar = picture;
      }
      if (typeof user.updateActivity === 'function') {
        await user.updateActivity();
      }
    } else {
      // Auto-register new Google user with secure random password
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await userService.createUser({
        name,
        email,
        password: randomPassword,
        avatar: picture || '',
        language: 'en',
        role: 'visitor',
        institution: 'Google Account Sign-In',
        authProvider: 'google',
        googleId: googleId || '',
      });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      message: 'Signed in with Google successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        avatar: user.avatar,
        institution: user.institution,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Persistent & In-Memory OTP Store ──────────────────
const otpMemoryStore = new Map();

function generateOTP() {
  return Math.floor(100000 + crypto.randomInt(0, 900000)).toString();
}

function maskTarget(target, type) {
  if (type === 'phone') {
    return target.length > 4 ? `${target.slice(0, 3)}******${target.slice(-3)}` : '******';
  }
  const parts = target.split('@');
  if (parts.length === 2 && parts[0].length > 2) {
    return `${parts[0][0]}***${parts[0].slice(-1)}@${parts[1]}`;
  }
  return '***@***';
}

async function saveOtpRecord(target, otpHash, expiresAt, type) {
  if (isDbConnected()) {
    try {
      await OtpVerification.deleteMany({ target });
      return await OtpVerification.create({
        target,
        otpHash,
        type,
        expiresAt: new Date(expiresAt),
        attempts: 0,
      });
    } catch (e) {
      // Fallback to memory store if DB write fails
    }
  }
  otpMemoryStore.set(target, { otpHash, expiresAt, attempts: 0, type });
}

async function getOtpRecord(target) {
  if (isDbConnected()) {
    try {
      const doc = await OtpVerification.findOne({ target, expiresAt: { $gt: new Date() } });
      if (doc) return doc;
    } catch (e) {
      // Fallback
    }
  }
  const mem = otpMemoryStore.get(target);
  if (mem && mem.expiresAt > Date.now()) {
    return mem;
  }
  return null;
}

async function incrementOtpAttempts(target, record) {
  if (isDbConnected() && record && typeof record.save === 'function') {
    try {
      record.attempts = (record.attempts || 0) + 1;
      return await record.save();
    } catch (e) {}
  }
  if (record) {
    record.attempts = (record.attempts || 0) + 1;
  }
}

async function deleteOtpRecord(target) {
  if (isDbConnected()) {
    try {
      await OtpVerification.deleteMany({ target });
    } catch (e) {}
  }
  otpMemoryStore.delete(target);
}

// POST /api/auth/send-otp
router.post(
  '/send-otp',
  authLimiter,
  [
    body('target').trim().notEmpty().withMessage('Identifier is required.'),
    body('type').optional().isIn(['phone', 'email', 'whatsapp', 'telegram']).withMessage('Type must be phone, email, whatsapp, or telegram.'),
    body('channel').optional().isIn(['phone', 'email', 'whatsapp', 'telegram']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const rawTarget = (req.body.target || '').trim();
      const channel = req.body.channel || req.body.type || (rawTarget.includes('@') && rawTarget.includes('.') ? 'email' : 'whatsapp');

      let cleanTarget = '';
      let displayTarget = '';

      if (channel === 'email') {
        cleanTarget = rawTarget.toLowerCase().trim();
        if (!cleanTarget.includes('@') || !cleanTarget.includes('.')) {
          return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }
        displayTarget = maskTarget(cleanTarget, 'email');
      } else if (channel === 'telegram') {
        const parsed = telegramOtpService.parsePhoneNumber(rawTarget);
        if (parsed.isPhone) {
          cleanTarget = parsed.e164;
          displayTarget = maskTarget(cleanTarget, 'phone');
        } else {
          cleanTarget = rawTarget.trim();
          if (!cleanTarget) {
            return res.status(400).json({ success: false, message: 'Please enter your mobile number or Telegram @username.' });
          }
          displayTarget = cleanTarget.startsWith('@') ? cleanTarget : '@' + cleanTarget;
        }
      } else {
        // WhatsApp or Phone OTP: normalize to Indian E.164 format (+91XXXXXXXXXX)
        const phoneNorm = whatsappOtpService.normalizeIndianPhone(rawTarget);
        if (!phoneNorm.valid) {
          return res.status(400).json({ success: false, message: phoneNorm.error });
        }
        cleanTarget = phoneNorm.e164;
        displayTarget = maskTarget(cleanTarget, 'phone');
      }

      // Enforce 60-second cooldown per target
      const existing = await getOtpRecord(cleanTarget);
      if (existing) {
        const remainingMs = (existing.expiresAt instanceof Date ? existing.expiresAt.getTime() : existing.expiresAt) - Date.now();
        if (remainingMs > 4 * 60 * 1000) {
          const waitSec = Math.ceil((remainingMs - 4 * 60 * 1000) / 1000);
          return res.status(429).json({
            success: false,
            message: `Please wait ${waitSec} seconds before requesting another code.`,
            retryAfter: waitSec,
          });
        }
      }

      const otp = generateOTP();
      const otpHash = cryptoUtil.hashOtp(otp);
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

      await saveOtpRecord(cleanTarget, otpHash, expiresAt, channel);

      // Dispatch via real delivery services
      let dispatchInfo = null;
      if (channel === 'email') {
        dispatchInfo = await emailOtpService.sendEmailOtp(cleanTarget, otp);
      } else if (channel === 'telegram') {
        dispatchInfo = await telegramOtpService.sendTelegramOtp(cleanTarget, otp);
      } else {
        dispatchInfo = await whatsappOtpService.sendWhatsAppOtp(cleanTarget, otp);
      }

      const channelName = channel === 'email' ? 'Email' : channel === 'telegram' ? 'Telegram' : 'WhatsApp';
      res.json({
        success: true,
        message: `OTP dispatched to ${displayTarget} via ${channelName}.`,
        target: displayTarget,
        channel,
        expiresIn: 300,
        provider: dispatchInfo ? dispatchInfo.provider : undefined,
      });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 400;
        err.code = err.code || 'DISPATCH_ERROR';
      }
      next(err);
    }
  }
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  authLimiter,
  [
    body('target').trim().notEmpty().withMessage('Target identifier is required.'),
    body('otp').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be a 6-digit number.'),
    body('type').optional().isIn(['phone', 'email', 'whatsapp', 'telegram']).withMessage('Type must be phone, email, whatsapp, or telegram.'),
    body('channel').optional().isIn(['phone', 'email', 'whatsapp', 'telegram']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { target, otp, name } = req.body;
      const channel = req.body.channel || req.body.type || (target.includes('@') ? 'email' : 'whatsapp');

      let cleanTarget = '';
      if (channel === 'email') {
        cleanTarget = target.toLowerCase().trim();
      } else if (channel === 'telegram') {
        const parsed = telegramOtpService.parsePhoneNumber(target);
        cleanTarget = parsed.isPhone ? parsed.e164 : target.trim();
      } else {
        const phoneNorm = whatsappOtpService.normalizeIndianPhone(target);
        cleanTarget = phoneNorm.valid ? phoneNorm.e164 : target.replace(/[^0-9+]/g, '').trim();
      }

      // Check primary identifier and normalized fallback
      let record = await getOtpRecord(cleanTarget);
      if (!record && cleanTarget.startsWith('+91')) {
        record = await getOtpRecord(cleanTarget.slice(3));
      }
      if (!record && !cleanTarget.startsWith('+') && cleanTarget.length === 10) {
        record = await getOtpRecord('+91' + cleanTarget);
      }

      if (!record) {
        return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new code.' });
      }

      const expiryTime = record.expiresAt instanceof Date ? record.expiresAt.getTime() : record.expiresAt;
      if (Date.now() > expiryTime) {
        await deleteOtpRecord(cleanTarget);
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      await incrementOtpAttempts(cleanTarget, record);

      if ((record.attempts || 0) > 3) {
        await deleteOtpRecord(cleanTarget);
        return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
      }

      // Constant-time SHA-256 verification
      const isValidOtp = cryptoUtil.verifyOtp(record.otpHash, otp);

      if (!isValidOtp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
      }

      // OTP is valid — consume immediately to prevent replay
      await deleteOtpRecord(cleanTarget);

      let user;
      if (channel === 'email') {
        user = await userService.findByEmail(cleanTarget);
        if (!user) {
          const autoPassword = crypto.randomBytes(24).toString('hex');
          const formattedName = name ? name.trim().slice(0, 100) : cleanTarget.split('@')[0];
          user = await userService.createUser({
            name: formattedName,
            email: cleanTarget,
            password: autoPassword,
            role: 'visitor',
            authProvider: 'email_otp',
            email_verified: true,
          });
        } else {
          user.email_verified = true;
          if (typeof user.save === 'function') await user.save();
        }
      } else if (channel === 'telegram') {
        const parsed = telegramOtpService.parsePhoneNumber(cleanTarget);
        const phoneFormatted = parsed.isPhone ? parsed.e164 : '';
        const tgEmail = parsed.isPhone
          ? `${parsed.tenDigits}@telegram.ambedkar-archive.in`
          : `${cleanTarget.replace(/[^a-zA-Z0-9_]/g, '')}@telegram.ambedkar-archive.in`;

        user = (phoneFormatted ? await userService.findByPhone(phoneFormatted) : null) || (await userService.findByEmail(tgEmail));
        if (!user) {
          const autoPassword = crypto.randomBytes(24).toString('hex');
          const formattedName = name ? name.trim().slice(0, 100) : (parsed.isPhone ? `Member ${parsed.tenDigits.slice(-4)}` : `Telegram ${cleanTarget}`);
          user = await userService.createUser({
            name: formattedName,
            email: tgEmail,
            phone: phoneFormatted,
            password: autoPassword,
            role: 'visitor',
            authProvider: 'telegram_otp',
            phone_verified: !!phoneFormatted,
          });
        } else {
          if (phoneFormatted) {
            user.phone = phoneFormatted;
            user.phone_verified = true;
          }
          if (typeof user.save === 'function') await user.save();
        }
      } else {
        // WhatsApp or Phone OTP
        user = await userService.findByPhone(cleanTarget);
        if (!user) {
          const autoPassword = crypto.randomBytes(24).toString('hex');
          const formattedName = name ? name.trim().slice(0, 100) : `Member ${cleanTarget.slice(-4)}`;
          user = await userService.createUser({
            name: formattedName,
            email: `${cleanTarget.replace('+', '')}@whatsapp.ambedkar-archive.in`,
            phone: cleanTarget,
            password: autoPassword,
            role: 'visitor',
            authProvider: 'whatsapp_otp',
            phone_verified: true,
          });
        } else {
          user.phone_verified = true;
          if (typeof user.save === 'function') await user.save();
        }
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
      }

      if (typeof user.updateActivity === 'function') {
        await user.updateActivity();
      }

      const token = signToken(user._id);

      res.json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          language: user.language || 'en',
          institution: user.institution || '',
          email_verified: !!user.email_verified,
          phone_verified: !!user.phone_verified,
          authProvider: user.authProvider,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || '',
      role: req.user.role,
      language: req.user.language,
      institution: req.user.institution,
      createdAt: req.user.createdAt,
      lastActiveAt: req.user.lastActiveAt,
    },
  });
});

// PATCH /api/auth/profile
router.patch(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('language').optional().isIn(['en', 'hi', 'mr']).withMessage('Language must be en, hi, or mr'),
    body('institution').optional().trim().isLength({ max: 200 }).withMessage('Institution max 200 characters'),
    body('phone').optional().trim().matches(/^[0-9+ ]{0,20}$/).withMessage('Invalid phone number format'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, language, institution, phone } = req.body;
      const updates = {};
      if (name) updates.name = name.trim();
      if (language) updates.language = language;
      if (institution !== undefined) updates.institution = institution.trim();
      if (phone) updates.phone = phone.replace(/[^0-9+]/g, '');

      const user = await userService.updateUser(req.user._id, updates);
      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          language: user.language,
          institution: user.institution,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);



// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully. Client session cleared.'
  });
});

module.exports = router;
