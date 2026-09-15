const express = require('express');
const router = express.Router();

const { getQuizStatus, register, getQuiz, submitAnswers, blockSelf } = require('../controllers/participantController');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, submitAnswersSchema } = require('../utils/validationSchemas');
const { registrationLimiter, submitLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/quiz-status — Public route to check if quiz is live
router.get('/quiz-status', asyncHandler(getQuizStatus));

// POST /api/register — Register a new participant (no password)
router.post(
  '/register',
  registrationLimiter,
  validate(registerSchema),
  asyncHandler(register)
);

// GET /api/quiz — Fetch quiz questions (JWT required, no correct answers)
router.get(
  '/quiz',
  asyncHandler(verifyToken),
  asyncHandler(getQuiz)
);

// POST /api/quiz/submit — Submit all answers atomically (JWT required)
router.post(
  '/quiz/submit',
  submitLimiter,
  asyncHandler(verifyToken),
  validate(submitAnswersSchema),
  asyncHandler(submitAnswers)
);

// POST /api/quiz/block-self — Lock participant account upon anti-cheat violation
router.post(
  '/quiz/block-self',
  asyncHandler(verifyToken),
  asyncHandler(blockSelf)
);

module.exports = router;
