'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const { DEFAULT_PASSWORD } = require('./factories');

/**
 * Builds the app once per suite.
 *
 * `mongoUrl: null` keeps express-session on its in-process MemoryStore, which
 * is all the tests need and keeps them free of a second connection.
 */
function buildApp() {
  return createApp({ mongoUrl: null });
}

/** A supertest agent that keeps the session cookie between calls. */
function agentFor(app) {
  return request.agent(app);
}

/** Signs an existing user in and returns their cookie-carrying agent. */
async function signIn(app, user, password = DEFAULT_PASSWORD) {
  const agent = agentFor(app);
  const response = await agent
    .post('/api/v1/auth/login')
    .send({ email: user.email, password });

  if (response.status !== 200) {
    throw new Error(
      `Sign-in failed for ${user.email}: ${response.status} ${JSON.stringify(response.body)}`
    );
  }

  return agent;
}

module.exports = { buildApp, agentFor, signIn };
