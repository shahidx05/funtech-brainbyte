const Participant = require('../models/Participant');
const Question = require('../models/Question');
const QuizSettings = require('../models/QuizSettings');
const generateToken = require('../utils/generateToken');

/**
 * GET /api/quiz-status
 * Public endpoint to check if quiz is currently live.
 */
async function getQuizStatus(req, res) {
  let settings = await QuizSettings.findOne({});
  if (!settings) {
    settings = await QuizSettings.create({ isLive: false });
  }

  res.status(200).json({
    success: true,
    data: {
      isLive: settings.isLive,
      title: settings.title,
    },
  });
}

/**
 * POST /api/register
 * Register a new participant (no password).
 * Returns a JWT for subsequent authenticated requests.
 */
async function register(req, res) {
  const { name, email, rollNumber } = req.body;

  // Check if a participant with this email already exists.
  // We also catch the unique-index E11000 below for race-condition safety,
  // but this pre-check gives a much better error message.
  const existing = await Participant.findOne({ email: email.toLowerCase() });

  if (existing) {
    if (existing.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disqualified and blocked due to anti-cheat security violations.',
        isBlocked: true,
      });
    }
    if (existing.submitted) {
      return res.status(409).json({
        success: false,
        message: 'You have already attempted this quiz.',
      });
    } else {
      // The user is already registered but hasn't submitted yet.
      // Generate a new token and let them resume seamlessly.
      const token = generateToken(existing);
      return res.status(200).json({
        success: true,
        message: 'Welcome back! Resuming your session.',
        data: {
          participant: existing.toPublicJSON(),
          token,
          tokenExpiresIn: process.env.JWT_EXPIRES_IN || '60m',
        },
      });
    }
  }

  let participant;
  try {
    participant = await Participant.create({
      name,
      email: email.toLowerCase(),
      rollNumber: rollNumber || null,
    });
  } catch (err) {
    // Race condition: another request created this email between our check and insert.
    // The unique index catches it via E11000.
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.',
      });
    }
    throw err; // Re-throw for global error handler
  }

  const token = generateToken(participant);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      participant: participant.toPublicJSON(),
      token,
      tokenExpiresIn: process.env.JWT_EXPIRES_IN || '60m',
    },
  });
}

/**
 * GET /api/quiz
 * Returns quiz questions WITHOUT correct answers.
 * Requires JWT authentication.
 */
async function getQuiz(req, res) {
  // Check if participant is blocked
  if (req.participant.isBlocked) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been disqualified and blocked due to security violations.',
      isBlocked: true,
    });
  }

  // Check if quiz is currently live
  let settings = await QuizSettings.findOne({});
  if (!settings) {
    settings = await QuizSettings.create({ isLive: false });
  }

  if (!settings.isLive) {
    return res.status(403).json({
      success: false,
      message: 'The quiz is not live yet. Please wait for the admin to start the quiz.',
      isNotLive: true,
    });
  }

  // Check if participant has already submitted
  if (req.participant.submitted) {
    return res.status(403).json({
      success: false,
      message: 'You have already submitted this quiz. Questions are no longer available.',
    });
  }

  let questions = await Question.find({}).sort({ order: 1 }).lean();

  // Optionally shuffle questions
  if (process.env.SHUFFLE_QUESTIONS === 'true') {
    questions = shuffleArray(questions);
  }

  // Strip correct answers before sending to client
  const clientQuestions = questions.map((q) => ({
    _id: q._id,
    questionText: q.questionText,
    options: q.options, // { key, text } — no correctOptionKey
    marks: q.marks,
    order: q.order,
  }));

  res.status(200).json({
    success: true,
    data: {
      questions: clientQuestions,
      totalQuestions: clientQuestions.length,
      timeLimitSeconds: parseInt(process.env.QUIZ_TIME_LIMIT_SECONDS, 10) || 1800,
    },
  });
}

/**
 * POST /api/quiz/submit
 * Submit all answers at once. Atomic and idempotent.
 * Requires JWT authentication.
 */
async function submitAnswers(req, res) {
  const { answers, timeTakenSeconds } = req.body;
  const participantId = req.participant._id;

  // Fetch all questions to calculate score server-side
  const questions = await Question.find({}).lean();

  if (questions.length === 0) {
    return res.status(500).json({
      success: false,
      message: 'No questions found in the database. Contact the organizer.',
    });
  }

  // Build a lookup map: questionId → correctOptionKey & marks
  const questionMap = new Map();
  for (const q of questions) {
    questionMap.set(q._id.toString(), {
      correctOptionKey: q.correctOptionKey,
      marks: q.marks,
    });
  }

  // Calculate score and build graded answers array
  let totalScore = 0;
  const gradedAnswers = [];

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) {
      // Skip unknown questionIds — don't crash, just ignore
      continue;
    }

    const isCorrect = answer.selectedOptionKey === question.correctOptionKey;
    if (isCorrect) {
      totalScore += question.marks;
    }

    gradedAnswers.push({
      questionId: answer.questionId,
      selectedOptionKey: answer.selectedOptionKey,
      isCorrect,
    });
  }

  // ── ATOMIC CONDITIONAL UPDATE ──────────────────────────────
  // This is the critical concurrency-safe operation.
  // findOneAndUpdate with { submitted: false } precondition ensures
  // only the FIRST submit succeeds. A second concurrent request
  // finds no matching document and gets null back → 409.
  const updatedParticipant = await Participant.findOneAndUpdate(
    {
      _id: participantId,
      submitted: false, // Only match if not yet submitted
    },
    {
      $set: {
        submitted: true,
        score: totalScore,
        timeTakenSeconds,
        submittedAt: new Date(),
        answers: gradedAnswers,
      },
    },
    {
      new: true, // Return the updated document
    }
  );

  // If null, the document either doesn't exist or was already submitted
  if (!updatedParticipant) {
    return res.status(409).json({
      success: false,
      message: 'Already submitted. Each participant can only submit once.',
    });
  }

  // Calculate max possible score for context
  const maxPossibleScore = questions.reduce((sum, q) => sum + q.marks, 0);

  res.status(200).json({
    success: true,
    message: 'Quiz submitted successfully',
    data: {
      score: totalScore,
      maxPossibleScore,
      totalQuestions: questions.length,
      attempted: gradedAnswers.length,
      correct: gradedAnswers.filter((a) => a.isCorrect).length,
      incorrect: gradedAnswers.filter((a) => !a.isCorrect).length,
      timeTakenSeconds,
      breakdown: gradedAnswers.map((a) => ({
        questionId: a.questionId,
        selectedOptionKey: a.selectedOptionKey,
        isCorrect: a.isCorrect,
      })),
    },
  });
}

/**
 * POST /api/quiz/block-self
 * Called by frontend when anti-cheat lockout threshold is reached.
 * Permanently sets isBlocked: true in Mongo.
 */
async function blockSelf(req, res) {
  const { reason } = req.body;
  const participantId = req.participant._id;

  await Participant.findByIdAndUpdate(participantId, {
    $set: {
      isBlocked: true,
      blockedReason: reason || 'Anti-cheat violation threshold reached (4 tab switches/defocus)',
    },
  });

  res.status(200).json({
    success: true,
    message: 'Participant account locked and blocked',
  });
}

// ── Helper ─────────────────────────────────────────────────
/**
 * Fisher-Yates shuffle (in-place, returns mutated array).
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = { getQuizStatus, register, getQuiz, submitAnswers, blockSelf };
