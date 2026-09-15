const request = require('supertest');
const app = require('../../src/app');
const Participant = require('../../src/models/Participant');
const Question = require('../../src/models/Question');
const generateToken = require('../../src/utils/generateToken');
const { connectTestDB, clearTestDB, closeTestDB } = require('../setup');

describe('Quiz Fetching Integration Tests', () => {
  let participant;
  let token;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_integration_key_12345';
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    participant = await Participant.create({
      name: 'John Doe',
      email: 'john@college.edu',
      submitted: false,
    });

    token = generateToken(participant);

    await Question.create([
      {
        questionText: 'What is 2 + 2?',
        options: [
          { key: 'A', text: '3' },
          { key: 'B', text: '4' },
          { key: 'C', text: '5' },
          { key: 'D', text: '6' },
        ],
        correctOptionKey: 'B',
        marks: 1,
        order: 1,
      },
      {
        questionText: 'Capital of France?',
        options: [
          { key: 'A', text: 'Berlin' },
          { key: 'B', text: 'Madrid' },
          { key: 'C', text: 'Paris' },
          { key: 'D', text: 'Rome' },
        ],
        correctOptionKey: 'C',
        marks: 2,
        order: 2,
      },
    ]);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('GET /api/quiz should return 401 if Authorization header is missing', async () => {
    const res = await request(app).get('/api/quiz');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/quiz should return questions without exposing correctOptionKey', async () => {
    const res = await request(app)
      .get('/api/quiz')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.questions).toHaveLength(2);
    expect(res.body.data.totalQuestions).toBe(2);
    expect(res.body.data.timeLimitSeconds).toBeDefined();

    // CRITICAL SECURITY ASSERTION: correctOptionKey must NOT be leaked
    for (const q of res.body.data.questions) {
      expect(q.correctOptionKey).toBeUndefined();
      expect(q.questionText).toBeDefined();
      expect(q.options).toBeDefined();
    }
  });

  it('GET /api/quiz should return 403 if participant already submitted', async () => {
    await Participant.findByIdAndUpdate(participant._id, { submitted: true });

    const res = await request(app)
      .get('/api/quiz')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already submitted');
  });
});
