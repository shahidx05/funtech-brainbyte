const request = require('supertest');
const app = require('../../src/app');
const Question = require('../../src/models/Question');
const Participant = require('../../src/models/Participant');
const { connectTestDB, clearTestDB, closeTestDB } = require('../setup');

describe('Admin Operations Integration Tests', () => {
  const adminSecret = 'master_admin_secret_key_45678';

  beforeAll(async () => {
    process.env.ADMIN_SECRET = adminSecret;
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('Admin endpoints should reject requests missing or invalid x-admin-secret', async () => {
    const resNoHeader = await request(app).get('/admin/questions');
    expect(resNoHeader.status).toBe(403);

    const resWrongHeader = await request(app)
      .get('/admin/questions')
      .set('x-admin-secret', 'wrong');
    expect(resWrongHeader.status).toBe(403);
  });

  it('POST & GET /admin/questions should create and list questions with answers', async () => {
    const createRes = await request(app)
      .post('/admin/questions')
      .set('x-admin-secret', adminSecret)
      .send({
        questionText: 'What does CSS stand for?',
        options: [
          { key: 'A', text: 'Cascading Style Sheets' },
          { key: 'B', text: 'Creative Style Sheets' },
          { key: 'C', text: 'Computer Style Sheets' },
          { key: 'D', text: 'Colorful Style Sheets' },
        ],
        correctOptionKey: 'A',
        marks: 2,
        order: 1,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.question.questionText).toBe('What does CSS stand for?');

    const listRes = await request(app)
      .get('/admin/questions')
      .set('x-admin-secret', adminSecret);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.questions).toHaveLength(1);
    expect(listRes.body.data.questions[0].correctOptionKey).toBe('A');
  });

  it('PUT & DELETE /admin/questions/:id should update and delete questions', async () => {
    const question = await Question.create({
      questionText: 'Old question title',
      options: [
        { key: 'A', text: 'Opt 1' },
        { key: 'B', text: 'Opt 2' },
      ],
      correctOptionKey: 'A',
      marks: 1,
    });

    const updateRes = await request(app)
      .put(`/admin/questions/${question._id}`)
      .set('x-admin-secret', adminSecret)
      .send({ questionText: 'Updated question title' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.question.questionText).toBe('Updated question title');

    const deleteRes = await request(app)
      .delete(`/admin/questions/${question._id}`)
      .set('x-admin-secret', adminSecret);

    expect(deleteRes.status).toBe(200);
    const count = await Question.countDocuments();
    expect(count).toBe(0);
  });

  it('GET /admin/results should return leaderboard sorted by score DESC and time ASC', async () => {
    await Participant.create([
      { name: 'User 1', email: 'u1@test.com', submitted: true, score: 10, timeTakenSeconds: 300 },
      { name: 'User 2', email: 'u2@test.com', submitted: true, score: 15, timeTakenSeconds: 400 },
      { name: 'User 3', email: 'u3@test.com', submitted: true, score: 15, timeTakenSeconds: 200 }, // Faster tie-break
    ]);

    const res = await request(app)
      .get('/admin/results')
      .set('x-admin-secret', adminSecret);

    expect(res.status).toBe(200);
    expect(res.body.data.results).toHaveLength(3);
    // User 3 should be rank 1 (15 score, 200s), User 2 rank 2 (15 score, 400s), User 1 rank 3 (10 score)
    expect(res.body.data.results[0].name).toBe('User 3');
    expect(res.body.data.results[0].rank).toBe(1);
    expect(res.body.data.results[1].name).toBe('User 2');
    expect(res.body.data.results[2].name).toBe('User 1');
  });

  it('GET /admin/participants should return participant counts and status', async () => {
    await Participant.create([
      { name: 'User A', email: 'ua@test.com', submitted: true, score: 5 },
      { name: 'User B', email: 'ub@test.com', submitted: false },
    ]);

    const res = await request(app)
      .get('/admin/participants')
      .set('x-admin-secret', adminSecret);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalRegistered).toBe(2);
    expect(res.body.data.stats.totalSubmitted).toBe(1);
    expect(res.body.data.stats.totalPending).toBe(1);
  });
});
