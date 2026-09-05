'use strict';

const env = require('./config/env');
const createApp = require('./app');
const { connect, disconnect } = require('./config/database');

/** Process entry point: connect to MongoDB, then start listening. */
async function start() {
  await connect();
  console.log('[db] connected to MongoDB');

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnect();
      process.exit(0);
    });
    // Do not let a hung connection hold the process open forever.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
