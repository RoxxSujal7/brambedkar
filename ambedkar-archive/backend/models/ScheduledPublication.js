const mongoose = require('mongoose');

const scheduledPublicationSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    contentId: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ['manuscripts', 'books', 'speeches', 'articles', 'photographs', 'audio', 'video', 'memorials', 'timeline', 'featured_content', 'debates', 'letters', 'volumes'],
    },
    title: {
      type: String,
      required: true,
    },
    scheduledPublishAt: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledBy: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'PUBLISHED', 'CANCELLED', 'FAILED'],
      default: 'SCHEDULED',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    errorDetails: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScheduledPublication', scheduledPublicationSchema);
