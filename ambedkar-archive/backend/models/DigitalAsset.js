const mongoose = require('mongoose');

const digitalAssetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    assetType: {
      type: String,
      enum: ['pdf', 'jpg', 'png', 'webp', 'audio', 'video', 'ocr_output', 'transcript', 'thumbnail', 'document'],
      required: true,
      index: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    sha256Checksum: {
      type: String,
      required: true,
      index: true,
    },
    uploader: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    processingStatus: {
      type: String,
      enum: ['READY', 'PROCESSING', 'VERIFIED', 'CORRUPTED', 'ARCHIVED'],
      default: 'READY',
      index: true,
    },
    lastVerifiedAt: {
      type: Date,
      default: Date.now,
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'FAILED', 'UNKNOWN'],
      default: 'VERIFIED',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    dublinCore: {
      title: String,
      creator: String,
      date: String,
      subject: [String],
      description: String,
      format: String,
      language: { type: String, default: 'en' },
      rights: String,
      sourceInstitution: { type: String, default: 'Dr. Ambedkar International Centre' },
    },
    versionHistory: [
      {
        version: Number,
        sha256: String,
        sizeBytes: Number,
        modifiedBy: String,
        modifiedAt: { type: Date, default: Date.now },
        changeReason: String,
      },
    ],
  },
  { timestamps: true }
);

digitalAssetSchema.index({ assetType: 1, isArchived: 1 });
digitalAssetSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DigitalAsset', digitalAssetSchema);
