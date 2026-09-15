const jwt = require('jsonwebtoken');
const Participant = require('../models/Participant');

/**
 * Middleware: Verify participant JWT token.
 * Extracts token from Authorization header, verifies it,
 * and attaches the participant document to req.participant.
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided. Send Authorization: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please register again to get a new token.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    // Verify participant still exists in DB
    const participant = await Participant.findById(decoded.id).select(
      '_id email name submitted isBlocked'
    );

    if (!participant) {
      return res.status(401).json({
        success: false,
        message: 'Participant not found. Token may be invalid.',
      });
    }

    req.participant = participant;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Verify admin secret.
 * Checks x-admin-secret header against the ADMIN_SECRET env var.
 */
function verifyAdmin(req, res, next) {
  const adminSecret = req.headers['x-admin-secret'];

  if (!adminSecret) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin secret required in x-admin-secret header.',
    });
  }

  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Invalid admin secret.',
    });
  }

  next();
}

module.exports = { verifyToken, verifyAdmin };
