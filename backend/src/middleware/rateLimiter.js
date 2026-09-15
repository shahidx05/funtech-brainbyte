const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for registration endpoint.
 * 10 requests per IP per 15 minutes — prevents spam registrations
 * while allowing reasonable retry behavior.
 */
const isTest = process.env.NODE_ENV === 'test';

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for quiz submission endpoint.
 * 5 requests per IP per 15 minutes — prevents accidental double-submits
 * from buggy frontend code or network retries.
 */
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submission attempts from this IP. Please try again later.',
  },
});

/**
 * General rate limiter applied globally.
 * 100 requests per IP per 15 minutes.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
});

module.exports = { registrationLimiter, submitLimiter, generalLimiter };
