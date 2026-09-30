const mongoose = require('mongoose');
const crypto = require('crypto');

const authEventSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'PASSWORD_CHANGED',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
        'OTP_REQUESTED',
        'OTP_VERIFIED',
        'OTP_FAILED',
        'GOOGLE_LOGIN',
        'TELEGRAM_LOGIN',
        'TELEGRAM_LINKED',
        'TELEGRAM_OTP_REQUESTED',
        'ROLE_CHANGED',
        'ACCOUNT_SUSPENDED',
        'ACCOUNT_REACTIVATED',
      ],
      index: true,
    },
    userEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      default: '',
      index: true,
    },
    authMethod: {
      type: String,
      enum: ['password', 'google', 'email_otp', 'whatsapp_otp', 'telegram_otp', 'system'],
      default: 'password',
    },
    success: {
      type: Boolean,
      default: true,
      index: true,
    },
    actor: {
      type: String,
      default: 'system',
    },
    ip: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: '',
    },
    requestId: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    eventId: {
      type: String,
      default: () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'evt_' + Math.random().toString(36).substring(2, 12)),
      index: true,
    },
    eventClassification: {
      type: String,
      enum: ['real', 'demo', 'test'],
      default: 'real',
      index: true,
    },
  },
  { timestamps: true }
);

authEventSchema.index({ createdAt: -1 });

// Enforce strict test data isolation before saving
authEventSchema.pre('save', function (next) {
  try {
    const userService = require('../services/userService');
    if (this.eventClassification === 'test' || (userService && userService.isTestEmail && userService.isTestEmail(this.userEmail))) {
      this.eventClassification = 'test';
      if (mongoose.connection && mongoose.connection.name === 'ambedkar_archive') {
        return next(new Error(`[TEST DATA ISOLATION] Blocked attempt to persist test AuthEvent (${this.userEmail}) into production database ambedkar_archive.`));
      }
    }
  } catch (err) {
    if (err.message && err.message.includes('[TEST DATA ISOLATION]')) return next(err);
  }
  next();
});

// Virtual aliases for frontend & audit consistency
authEventSchema.virtual('provider').get(function () {
  return this.authMethod;
});

authEventSchema.virtual('eventType').get(function () {
  return this.event;
});

authEventSchema.virtual('timestamp').get(function () {
  return this.createdAt;
});

authEventSchema.virtual('ipAddress').get(function () {
  return this.ip;
});

authEventSchema.set('toJSON', { virtuals: true });
authEventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AuthEvent', authEventSchema);
