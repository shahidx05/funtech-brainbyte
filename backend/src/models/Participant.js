const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    submitted: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: null,
    },
    timeTakenSeconds: {
      type: Number,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedReason: {
      type: String,
      default: null,
    },
    // Embedded answers — justified in README.
    // For a single-attempt quiz with ≤150 users and ≤50 questions,
    // embedding keeps the atomic submit as a single findOneAndUpdate
    // and avoids a separate collection + transaction overhead.
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true,
        },
        selectedOptionKey: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
        _id: false, // Don't auto-generate _id for subdocuments
      },
    ],
  },
  {
    timestamps: false, // We use registeredAt / submittedAt manually
    versionKey: false,
  }
);

// ── Indexes ────────────────────────────────────────────────
// Unique index on email is created automatically by `unique: true`.
// Index on `submitted` speeds up admin queries (filter by attempt status).
participantSchema.index({ submitted: 1 });

// ── Instance method ────────────────────────────────────────
// Returns a safe public representation (no internal Mongo fields).
participantSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    rollNumber: this.rollNumber,
    registeredAt: this.registeredAt,
    submitted: this.submitted,
    score: this.score,
    timeTakenSeconds: this.timeTakenSeconds,
    submittedAt: this.submittedAt,
    isBlocked: this.isBlocked,
    blockedReason: this.blockedReason,
  };
};

module.exports = mongoose.model('Participant', participantSchema);
