// globals enabled via vitest config (describe, it, expect, beforeAll)
const jwt = require('jsonwebtoken');
const generateToken = require('../../src/utils/generateToken');

describe('generateToken Unit Tests', () => {
  const mockSecret = 'test_secret_for_unit_tests_1234567890abcdef';

  beforeAll(() => {
    process.env.JWT_SECRET = mockSecret;
    process.env.JWT_EXPIRES_IN = '1h';
  });

  it('should generate a valid signed JWT containing participant id and email', () => {
    const mockParticipant = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
    };

    const token = generateToken(mockParticipant);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = jwt.verify(token, mockSecret);
    expect(decoded.id).toBe(mockParticipant._id);
    expect(decoded.email).toBe(mockParticipant.email);
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});
