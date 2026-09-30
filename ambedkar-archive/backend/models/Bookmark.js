const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
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
    },
    note: { type: String, default: '', maxlength: 500 },
    highlightText: { type: String, default: '', maxlength: 1000 },
    scrollPosition: { type: Number, default: 0 },
    color: {
      type: String,
      enum: ['yellow', 'blue', 'green', 'red', 'purple'],
      default: 'yellow',
    },
  },
  { timestamps: true }
);

// No duplicate bookmarks per user per document
bookmarkSchema.index({ userId: 1, documentId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
