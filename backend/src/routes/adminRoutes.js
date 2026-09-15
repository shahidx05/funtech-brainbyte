const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { questionSchema, questionUpdateSchema } = require('../utils/validationSchemas');
const { asyncHandler } = require('../middleware/errorHandler');

// All admin routes require the x-admin-secret header
router.use(verifyAdmin);

// ── Quiz Settings & Live Toggle ────────────────────────────
router.get('/quiz-settings', asyncHandler(getQuizSettings));
router.put('/quiz-settings', asyncHandler(updateQuizSettings));
router.put('/quiz-toggle-live', asyncHandler(toggleQuizLive));

// ── Question CRUD ──────────────────────────────────────────
router.post('/questions', validate(questionSchema), asyncHandler(addQuestion));
router.get('/questions', asyncHandler(listQuestions));
router.put('/questions/:id', validate(questionUpdateSchema), asyncHandler(updateQuestion));
router.delete('/questions/:id', asyncHandler(deleteQuestion));

// ── Results & Participants ─────────────────────────────────
router.get('/results', asyncHandler(getResults));
router.get('/participants', asyncHandler(getParticipants));
router.delete('/participants/:id', asyncHandler(deleteParticipant));
router.put('/participants/:id/toggle-block', asyncHandler(toggleBlockParticipant));
router.put('/participants/:id/reset', asyncHandler(resetParticipantScore));
router.post('/reset-scores', asyncHandler(clearAllScores));
router.delete('/participants', asyncHandler(deleteAllParticipants));

module.exports = router;
