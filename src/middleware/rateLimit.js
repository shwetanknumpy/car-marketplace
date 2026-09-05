'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * Rate limits, disabled under test so the suite is not throttled by its own
 * repeated sign-in calls.
 */
const passthrough = (_req, _res, next) => next();

const authLimiter = env.isTest
  ? passthrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        error: { message: 'Too many attempts. Try again in a few minutes.' },
      },
    });

const writeLimiter = env.isTest
  ? passthrough
  : rateLimit({
      windowMs: 60 * 1000,
      limit: 60,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    });

module.exports = { authLimiter, writeLimiter };
