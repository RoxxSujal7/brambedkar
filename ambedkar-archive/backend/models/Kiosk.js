const mongoose = require('mongoose');

const kioskSchema = new mongoose.Schema(
  {
    kioskId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN'],
      default: 'UNKNOWN',
      index: true,
    },
    lastHeartbeat: {
      type: Date,
      default: null,
      index: true,
    },
    appVersion: {
      type: String,
      default: '1.0.0',
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'en',
    },
    assignedContent: {
      type: String,
      default: 'General Archive Exploration',
    },
    playlist: [
      {
        contentId: String,
        contentType: String,
        title: String,
        durationSeconds: Number,
      },
    ],
    lastSyncAt: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    deviceMetadata: {
      os: String,
      browser: String,
      screenResolution: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Kiosk', kioskSchema);
