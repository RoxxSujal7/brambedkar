const mongoose = require('mongoose');

const readingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed, // Accepts ObjectId OR in-memory string IDs (e.g. user-xxxx)
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.Mixed, // Accepts ObjectId OR slug/string IDs (e.g. doc-annihilation)
      ref: 'Document',
      required: true,
      index: true,
    },
    scrollPosition: { type: Number, default: 0 },    // px from top
    percentComplete: { type: Number, default: 0, min: 0, max: 100 },
    lastReadAt: { type: Date, default: Date.now },
    timeSpentSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    currentPage: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// One progress record per user per document
readingProgressSchema.index({ userId: 1, documentId: 1 }, { unique: true });

module.exports = mongoose.model('ReadingProgress', readingProgressSchema);
