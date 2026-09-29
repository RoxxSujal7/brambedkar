const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cryptoUtil = require('../utils/cryptoUtil');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be less than 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never return password in queries
    },
    role: {
      type: String,
      enum: ['visitor', 'researcher', 'content_editor', 'archivist', 'super_admin', 'admin'],
      default: 'visitor',
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'en',
    },
    avatar: {
      type: String,
      default: '',
    },
    institution: {
      type: String,
      default: '',
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'phone', 'email_otp', 'whatsapp_otp', 'telegram_otp'],
      default: 'local',
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    phone_verified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    firstLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    failedLoginCount: {
      type: Number,
      default: 0,
    },
    lastLoginIp: {
      type: String,
      default: '',
    },
    lastUserAgent: {
      type: String,
      default: '',
    },
    providerAccountId: {
      type: String,
      default: '',
      index: true,
    },
    userClassification: {
      type: String,
      enum: ['real', 'demo', 'test', 'seeded'],
      default: 'real',
    },
  },
  { timestamps: true }
);

// Virtual aliases for standard production identity fields
userSchema.virtual('userId').get(function () {
  return String(this._id);
});

userSchema.virtual('provider').get(function () {
  return this.authProvider;
});

userSchema.virtual('status').get(function () {
  return this.isActive ? 'active' : 'suspended';
});

userSchema.virtual('totalLoginCount').get(function () {
  return this.loginCount || 0;
});

userSchema.virtual('lastActivityAt').get(function () {
  return this.lastActiveAt;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Hash password before saving (with SHA-256 pre-hashing) and record passwordChangedAt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await cryptoUtil.hashPassword(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000); // 1s buffer for clock skew / token issuance
  }
  next();
});

// Compare plain password to hashed (verifies SHA-256 pre-hash with legacy bcrypt fallback)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await cryptoUtil.comparePassword(candidatePassword, this.password);
};

// Update lastActiveAt on login
userSchema.methods.updateActivity = function () {
  this.lastActiveAt = Date.now();
  return this.save({ validateBeforeSave: false });
};

// Record successful authentication event on user
userSchema.methods.recordLogin = function ({ ip = '', userAgent = '' } = {}) {
  const now = new Date();
  if (!this.firstLoginAt) {
    this.firstLoginAt = now;
  }
  this.lastLoginAt = now;
  this.lastActiveAt = now;
  this.loginCount = (this.loginCount || 0) + 1;
  if (ip) this.lastLoginIp = ip;
  if (userAgent) this.lastUserAgent = userAgent;
  return this.save({ validateBeforeSave: false });
};

// Record failed login attempt
userSchema.methods.recordLoginFailure = function () {
  this.failedLoginCount = (this.failedLoginCount || 0) + 1;
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);
