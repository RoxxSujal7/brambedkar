const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'FAILED_LOGINS_THRESHOLD',
        'OTP_FAILURES_THRESHOLD',
        'SUSPICIOUS_AUTH_PATTERN',
        'ROLE_CHANGE_SENSITIVE',
        'ACCOUNT_SUSPENSION',
        'PASSWORD_RESET_ANOMALY',
        'AUTH_PROVIDER_CHANGE',
        'UNAUTHORIZED_ADMIN_ACCESS',
        'RATE_LIMIT_BREACH',
      ],
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['INFO', 'WARNING', 'HIGH', 'CRITICAL'],
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      default: '',
    },
    targetUser: {
      type: String,
      default: '',
      index: true,
    },
    sourceIp: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['UNRESOLVED', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'UNRESOLVED',
      index: true,
    },
    acknowledgedBy: {
      type: String,
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    internalNotes: [
      {
        note: String,
        author: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

securityEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
