const Question = require('../models/Question');
const Participant = require('../models/Participant');
const QuizSettings = require('../models/QuizSettings');

// ═══════════════════════════════════════════════════════════
// Quiz Live Toggle & Settings
// ═══════════════════════════════════════════════════════════

/**
 * GET /admin/quiz-settings
 * Get current quiz live status and settings.
 */
async function getQuizSettings(req, res) {
  let settings = await QuizSettings.findOne({});
  if (!settings) {
    settings = await QuizSettings.create({ isLive: false });
  }

  res.status(200).json({
    success: true,
    data: { settings },
  });
}

/**
 * PUT /admin/quiz-settings
 * Update quiz configuration settings (rateLimitEnabled, maxRequestsPerIp, etc.).
 */
async function updateQuizSettings(req, res) {
  const { rateLimitEnabled, maxRequestsPerIp, isLive } = req.body;

  let settings = await QuizSettings.findOne({});
  if (!settings) {
    settings = await QuizSettings.create({});
  }

  if (typeof rateLimitEnabled === 'boolean') {
    settings.rateLimitEnabled = rateLimitEnabled;
  }

  if (typeof maxRequestsPerIp === 'number' && maxRequestsPerIp > 0) {
    settings.maxRequestsPerIp = maxRequestsPerIp;
  }

  if (typeof isLive === 'boolean') {
    settings.isLive = isLive;
  }

  await settings.save();

  res.status(200).json({
    success: true,
    message: 'Quiz settings updated successfully',
    data: { settings },
  });
}

/**
 * PUT /admin/quiz-toggle-live
 * Toggle quiz live state (true/false).
 */
async function toggleQuizLive(req, res) {
  const { isLive } = req.body;

  let settings = await QuizSettings.findOne({});
  if (!settings) {
    settings = await QuizSettings.create({ isLive: !!isLive });
  } else {
    settings.isLive = typeof isLive === 'boolean' ? isLive : !settings.isLive;
    await settings.save();
  }

  res.status(200).json({
    success: true,
    message: `Quiz is now ${settings.isLive ? 'LIVE' : 'PAUSED / NOT LIVE'}`,
    data: { settings },
  });
}

// ═══════════════════════════════════════════════════════════
// Question CRUD
// ═══════════════════════════════════════════════════════════

/**
 * POST /admin/questions
 * Add a new question.
 */
async function addQuestion(req, res) {
  const { questionText, options, correctOptionKey, marks, order } = req.body;

  // Validate that correctOptionKey matches one of the option keys
  const optionKeys = options.map((o) => o.key);
  if (!optionKeys.includes(correctOptionKey)) {
    return res.status(400).json({
      success: false,
      message: `correctOptionKey "${correctOptionKey}" does not match any option key. Available keys: ${optionKeys.join(', ')}`,
    });
  }

  const question = await Question.create({
    questionText,
    options,
    correctOptionKey,
    marks: marks ?? 1,
    order: order ?? 0,
  });

  res.status(201).json({
    success: true,
    message: 'Question created',
    data: { question },
  });
}

/**
 * GET /admin/questions
 * List all questions (with correct answers — admin only).
 */
async function listQuestions(req, res) {
  const questions = await Question.find({}).sort({ order: 1 }).lean();

  res.status(200).json({
    success: true,
    data: {
      questions,
      totalQuestions: questions.length,
    },
  });
}

/**
 * PUT /admin/questions/:id
 * Update an existing question.
 */
async function updateQuestion(req, res) {
  const { id } = req.params;
  const updates = req.body;

  // If updating options and correctOptionKey, validate they match
  if (updates.options && updates.correctOptionKey) {
    const optionKeys = updates.options.map((o) => o.key);
    if (!optionKeys.includes(updates.correctOptionKey)) {
      return res.status(400).json({
        success: false,
        message: `correctOptionKey "${updates.correctOptionKey}" does not match any option key.`,
      });
    }
  }

  const question = await Question.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Question updated',
    data: { question },
  });
}

/**
 * DELETE /admin/questions/:id
 * Delete a question.
 */
async function deleteQuestion(req, res) {
  const question = await Question.findByIdAndDelete(req.params.id);

  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Question deleted',
  });
}

// ═══════════════════════════════════════════════════════════
// Results & Participants
// ═══════════════════════════════════════════════════════════

/**
 * GET /admin/results
 * Full leaderboard: all submitted participants sorted by score (desc),
 * then by time taken (asc) as tiebreaker.
 */
async function getResults(req, res) {
  const results = await Participant.find({ submitted: true })
    .select('name email rollNumber score timeTakenSeconds submittedAt')
    .sort({ score: -1, timeTakenSeconds: 1 })
    .lean();

  // Add rank
  const rankedResults = results.map((r, index) => ({
    rank: index + 1,
    ...r,
  }));

  res.status(200).json({
    success: true,
    data: {
      results: rankedResults,
      totalSubmissions: rankedResults.length,
    },
  });
}

/**
 * GET /admin/participants
 * All registered participants with attempt status.
 */
async function getParticipants(req, res) {
  const participants = await Participant.find({})
    .select('name email rollNumber registeredAt submitted score timeTakenSeconds submittedAt isBlocked blockedReason')
    .sort({ registeredAt: -1 })
    .lean();

  const stats = {
    totalRegistered: participants.length,
    totalSubmitted: participants.filter((p) => p.submitted).length,
    totalPending: participants.filter((p) => !p.submitted && !p.isBlocked).length,
    totalBlocked: participants.filter((p) => p.isBlocked).length,
  };

  res.status(200).json({
    success: true,
    data: {
      participants,
      stats,
    },
  });
}

/**
 * DELETE /admin/participants/:id
 * Delete a specific participant by ID.
 */
async function deleteParticipant(req, res) {
  const participant = await Participant.findByIdAndDelete(req.params.id);
  if (!participant) {
    return res.status(404).json({ success: false, message: 'Participant not found' });
  }
  res.status(200).json({ success: true, message: 'Participant removed successfully' });
}

/**
 * PUT /admin/participants/:id/toggle-block
 * Admin manual block / disqualify or unblock participant.
 */
async function toggleBlockParticipant(req, res) {
  const participant = await Participant.findById(req.params.id);
  if (!participant) {
    return res.status(404).json({ success: false, message: 'Participant not found' });
  }

  participant.isBlocked = !participant.isBlocked;
  participant.blockedReason = participant.isBlocked ? 'Disqualified by Admin' : null;
  await participant.save();

  res.status(200).json({
    success: true,
    message: `Participant ${participant.isBlocked ? 'blocked/disqualified' : 'unblocked'}`,
    data: { participant },
  });
}

/**
 * PUT /admin/participants/:id/reset
 * Reset score and quiz attempt for a participant (allows re-taking quiz).
 */
async function resetParticipantScore(req, res) {
  const participant = await Participant.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        submitted: false,
        score: 0,
        answers: [],
        timeTakenSeconds: 0,
        startedAt: null,
        submittedAt: null,
        isBlocked: false,
        blockedReason: null,
      },
    },
    { new: true }
  );

  if (!participant) {
    return res.status(404).json({ success: false, message: 'Participant not found' });
  }

  res.status(200).json({ success: true, message: 'Participant score reset successfully', data: { participant } });
}

/**
 * POST /admin/reset-scores
 * Clear scores and quiz attempt data for ALL participants.
 */
async function clearAllScores(req, res) {
  await Participant.updateMany(
    {},
    {
      $set: {
        submitted: false,
        score: 0,
        answers: [],
        timeTakenSeconds: 0,
        startedAt: null,
        submittedAt: null,
        isBlocked: false,
        blockedReason: null,
      },
    }
  );

  res.status(200).json({ success: true, message: 'All participant scores and attempts reset successfully' });
}

/**
 * DELETE /admin/participants
 * Delete ALL participants from roster.
 */
async function deleteAllParticipants(req, res) {
  await Participant.deleteMany({});
  res.status(200).json({ success: true, message: 'All participants removed successfully' });
}

module.exports = {
  getQuizSettings,
  updateQuizSettings,
  toggleQuizLive,
  addQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion,
  getResults,
  getParticipants,
  deleteParticipant,
  toggleBlockParticipant,
  resetParticipantScore,
  clearAllScores,
  deleteAllParticipants,
};
