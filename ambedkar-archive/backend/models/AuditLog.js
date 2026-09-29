const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      default: 'unknown',
    },
    target: {
      type: String,
      default: '',
    },
    resourceType: {
      type: String,
      default: 'system',
      index: true,
    },
    resourceId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'DENIED'],
      default: 'SUCCESS',
    },
    reason: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    ip: {
      type: String,
      default: 'unknown',
    },
    requestId: {
      type: String,
      default: '',
    },
    beforeState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    afterState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
