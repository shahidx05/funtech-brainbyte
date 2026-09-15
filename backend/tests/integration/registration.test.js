const request = require('supertest');
const app = require('../../src/app');
const Participant = require('../../src/models/Participant');
const { connectTestDB, clearTestDB, closeTestDB } = require('../setup');

describe('Participant Registration Integration Tests', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_integration_key_12345';
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('POST /api/register should create a new participant and return 201 with JWT', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'Rahul Roy',
        email: 'rahul.roy@college.edu',
        rollNumber: 'CS101',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Registration successful');
    expect(res.body.data.participant.email).toBe('rahul.roy@college.edu');
    expect(res.body.data.participant.name).toBe('Rahul Roy');
    expect(res.body.data.participant.submitted).toBe(false);
    expect(typeof res.body.data.token).toBe('string');
  });

  it('POST /api/register should allow unsubmitted user to resume session with 200', async () => {
    await Participant.create({
      name: 'Simran Kaur',
      email: 'simran@college.edu',
      submitted: false,
    });

    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'Simran Kaur',
        email: 'simran@college.edu',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Resuming your session');
    expect(typeof res.body.data.token).toBe('string');
  });

  it('POST /api/register should return 409 if user has already submitted', async () => {
    await Participant.create({
      name: 'Rohan Verma',
      email: 'rohan@college.edu',
      submitted: true,
      score: 18,
    });

    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'Rohan Verma',
        email: 'rohan@college.edu',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already attempted');
  });

  it('POST /api/register should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'No Email User',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
  });
});
