'use strict';

const session = require('express-session');
const MongoStore = require('connect-mongo');
const env = require('./env');

/**
 * Server-side session store.
 *
 * The cookie carries nothing but a signed session id — role and user id live
 * in the store, where a client cannot edit them. `httpOnly` keeps the id away
 * from scripts, and `sameSite: 'lax'` blocks cross-site form posts from
 * riding on it.
 */
function buildSessionMiddleware(mongoUrl = env.mongoUri) {
  const options = {
    name: env.session.name,
    secret: env.session.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      maxAge: env.session.ttlMs,
    },
  };

  if (mongoUrl) {
    options.store = MongoStore.create({
      mongoUrl,
      collectionName: 'sessions',
      ttl: Math.floor(env.session.ttlMs / 1000),
      touchAfter: 24 * 3600,
    });
  }

  return session(options);
}

module.exports = { buildSessionMiddleware };
