const request = require('supertest');
const app = require('../../src/app');
const { connectTestDB, closeTestDB } = require('../setup');

describe('Health Check Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('GET /health should return 200 healthy when database is connected', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /non-existent-route should return 404', async () => {
    const res = await request(app).get('/api/unknown-route-xyz');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
