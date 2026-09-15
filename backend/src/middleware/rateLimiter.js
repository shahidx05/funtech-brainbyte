const rateLimit = require('express-rate-limit');
const QuizSettings = require('../models/QuizSettings');

/**
 * Dynamic rate limiter middleware.
 * Checks Mongo QuizSettings to see if rate limiting is enabled & max per IP.
 */
async function dynamicRateLimiter(req, res, next) {
  try {
    let settings = await QuizSettings.findOne({});
    if (!settings) {
      settings = await QuizSettings.create({ rateLimitEnabled: false, maxRequestsPerIp: 500 });
    }

    // If disabled by admin, skip rate limiting completely
    if (!settings.rateLimitEnabled) {
      return next();
    }

    // Use express-rate-limit logic dynamically or custom IP hit tracking
    const windowMs = 15 * 60 * 1000;
    const max = settings.maxRequestsPerIp || 500;

    const limiter = rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: `Too many requests from this IP address (Limit: ${max} per 15 min). Ask Admin to adjust or disable Rate Limit in Settings.`,
      },
    });

    return limiter(req, res, next);
  } catch (err) {
    next(); // Pass through on error so quiz is never blocked accidentally
  }
}

module.exports = {
  registrationLimiter: dynamicRateLimiter,
  submitLimiter: dynamicRateLimiter,
  generalLimiter: dynamicRateLimiter,
};
