'use strict';

const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

/**
 * Opens the shared Mongoose connection.
 *
 * `autoIndex` is deliberately off in production: index builds belong in a
 * deploy step (`npm run seed` / `syncIndexes`), not in the request path of a
 * freshly booted process.
 */
async function connect(uri = env.mongoUri) {
  if (!uri) {
    throw new Error('No MongoDB connection string provided');
  }

  await mongoose.connect(uri, {
    autoIndex: !env.isProduction,
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });

  return mongoose.connection;
}

async function disconnect() {
  await mongoose.disconnect();
}

/** Builds every declared index. Safe to run repeatedly. */
async function syncIndexes() {
  const models = require('../models');
  await Promise.all(Object.values(models).map((model) => model.syncIndexes()));
}

module.exports = { connect, disconnect, syncIndexes, mongoose };
