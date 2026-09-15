// globals enabled via vitest config (describe, it, expect, vi, beforeEach)
const { verifyAdmin } = require('../../src/middleware/auth');

describe('Auth Middleware Unit Tests', () => {
  const mockAdminSecret = 'secret_admin_token_xyz_987';

  beforeEach(() => {
    process.env.ADMIN_SECRET = mockAdminSecret;
  });

  it('should return 403 when x-admin-secret is missing', () => {
    const req = { headers: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    verifyAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Admin secret required'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when x-admin-secret is incorrect', () => {
    const req = { headers: { 'x-admin-secret': 'wrong_secret' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    verifyAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Invalid admin secret'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() when x-admin-secret matches ADMIN_SECRET', () => {
    const req = { headers: { 'x-admin-secret': mockAdminSecret } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    verifyAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
