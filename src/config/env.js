'use strict';

require('dotenv').config();

/**
 * Central, validated view of the process environment.
 *
 * Reading env vars in exactly one place keeps the rest of the codebase free of
 * `process.env` lookups, which is what makes the service and repository layers
 * straightforward to instantiate inside tests.
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const isTest = NODE_ENV === 'test';
const isProduction = NODE_ENV === 'production';

function required(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function int(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const env = {
  NODE_ENV,
  isTest,
  isProduction,
  isDevelopment: NODE_ENV === 'development',

  port: int('PORT', 3000),
  trustProxy: process.env.TRUST_PROXY === '1',

  mongoUri: isTest
    ? process.env.MONGODB_URI || ''
    : required('MONGODB_URI', 'mongodb://127.0.0.1:27017/car_marketplace'),

  session: {
    // A throwaway secret is acceptable for tests only; every other environment
    // must supply its own.
    secret: isTest
      ? process.env.SESSION_SECRET || 'test-session-secret'
      : required('SESSION_SECRET'),
    name: process.env.SESSION_NAME || 'cm.sid',
    ttlMs: int('SESSION_TTL_MS', 7 * 24 * 60 * 60 * 1000),
  },

  pagination: {
    defaultPageSize: 12,
    maxPageSize: int('MAX_PAGE_SIZE', 50),
  },
};

module.exports = env;
