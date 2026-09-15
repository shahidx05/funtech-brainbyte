const mongoose = require('mongoose');

const quizSettingsSchema = new mongoose.Schema(
  {
    isLive: {
      type: Boolean,
      default: false,
    },
    rateLimitEnabled: {
      type: Boolean,
      default: false, // Default false so shared college WiFi works out of the box
    },
    maxRequestsPerIp: {
      type: Number,
      default: 500,
    },
    title: {
      type: String,
      default: "FunTech BrainByte '26",
    },
    scheduledStartTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('QuizSettings', quizSettingsSchema);
