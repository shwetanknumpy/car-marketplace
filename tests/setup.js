'use strict';

/**
 * Database fixture for the suite.
 *
 * Prefers a real MongoDB when `TEST_MONGODB_URI` points at one (that is what
 * CI does with a service container), and otherwise falls back to an ephemeral
 * in-memory server. Either way the tests run against real Mongoose models and
 * real indexes — including the unique ones the services depend on — rather
 * than a stubbed driver.
 */

const crypto = require('crypto');
const mongoose = require('mongoose');

let memoryServer;

async function resolveUri() {
  const external = process.env.TEST_MONGODB_URI;

  if (external) {
    // Give each test file its own database so files cannot interfere.
    const suffix = crypto.randomBytes(6).toString('hex');
    return external.replace(/\/?(\?|$)/, `/cm_test_${suffix}$1`);
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  return memoryServer.getUri();
}

beforeAll(async () => {
  const uri = await resolveUri();
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);

  // Build the declared indexes so uniqueness is enforced during tests exactly
  // as it is in production.
  const models = require('../src/models');
  await Promise.all(Object.values(models).map((model) => model.syncIndexes()));
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.connection.close();
  }
  if (memoryServer) await memoryServer.stop();
});
