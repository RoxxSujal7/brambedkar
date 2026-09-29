const mongoose = require('mongoose');

const searchTelemetrySchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resultsCount: {
      type: Number,
      default: 0,
      index: true,
    },
    filterType: {
      type: String,
      default: 'all',
    },
    language: {
      type: String,
      default: 'en',
    },
    isZeroResult: {
      type: Boolean,
      default: false,
      index: true,
    },
    clickedDocumentId: {
      type: String,
      default: null,
    },
    searchMode: {
      type: String,
      enum: ['keyword', 'hybrid', 'semantic'],
      default: 'hybrid',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

searchTelemetrySchema.index({ timestamp: -1 });

module.exports = mongoose.model('SearchTelemetry', searchTelemetrySchema);
