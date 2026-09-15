const request = require('supertest');
const app = require('../../src/app');
const Participant = require('../../src/models/Participant');
const Question = require('../../src/models/Question');
const generateToken = require('../../src/utils/generateToken');
const { connectTestDB, clearTestDB, closeTestDB } = require('../setup');

describe('Quiz Submission Integration Tests', () => {
  let participant;
  let token;
  let q1, q2;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_integration_key_12345';
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    participant = await Participant.create({
      name: 'Sneha Roy',
      email: 'sneha@college.edu',
      submitted: false,
    });

    token = generateToken(participant);

    q1 = await Question.create({
      questionText: 'Which language is used with React?',
      options: [
        { key: 'A', text: 'JavaScript' },
        { key: 'B', text: 'Cobol' },
        { key: 'C', text: 'Fortran' },
        { key: 'D', text: 'Pascal' },
      ],
      correctOptionKey: 'A',
      marks: 1,
      order: 1,
    });

    q2 = await Question.create({
      questionText: 'What is 10 * 10?',
      options: [
        { key: 'A', text: '50' },
        { key: 'B', text: '100' },
        { key: 'C', text: '200' },
        { key: 'D', text: '1000' },
      ],
      correctOptionKey: 'B',
      marks: 3,
      order: 2,
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('POST /api/quiz/submit should calculate correct score and return detailed breakdown', async () => {
    const res = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: q1._id.toString(), selectedOptionKey: 'A' }, // Correct (1 mark)
          { questionId: q2._id.toString(), selectedOptionKey: 'C' }, // Wrong (0 mark)
        ],
        timeTakenSeconds: 450,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBe(1);
    expect(res.body.data.maxPossibleScore).toBe(4);
    expect(res.body.data.correct).toBe(1);
    expect(res.body.data.incorrect).toBe(1);
    expect(res.body.data.timeTakenSeconds).toBe(450);

    // Verify DB update
    const updated = await Participant.findById(participant._id);
    expect(updated.submitted).toBe(true);
    expect(updated.score).toBe(1);
  });

  it('POST /api/quiz/submit should return 409 Conflict on double submission', async () => {
    // First submit succeeds
    const firstRes = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [{ questionId: q1._id.toString(), selectedOptionKey: 'A' }],
        timeTakenSeconds: 300,
      });
    expect(firstRes.status).toBe(200);

    // Immediate second submit must fail with 409
    const secondRes = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [{ questionId: q1._id.toString(), selectedOptionKey: 'A' }],
        timeTakenSeconds: 300,
      });

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.success).toBe(false);
    expect(secondRes.body.message).toContain('Already submitted');
  });
});
