const mongoose = require('mongoose');

const telegramContactSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    username: {
      type: String,
      index: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      index: true,
      trim: true,
    },
    tenDigits: {
      type: String,
      index: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TelegramContact', telegramContactSchema);
