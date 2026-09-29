const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    affectedSubsystems: [String],
    createdBy: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: String,
      default: 'Unassigned',
    },
    timeline: [
      {
        action: String,
        actor: String,
        details: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    internalNotes: [
      {
        note: String,
        author: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionSummary: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
