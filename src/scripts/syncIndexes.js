'use strict';

/**
 * Builds every index declared on the schemas, without touching documents.
 *
 * `autoIndex` is off in production, so index creation has to be an explicit
 * deploy step rather than something a booting process does in the request
 * path. `seed.js` also syncs indexes, but it clears the collections first and
 * is therefore development-only — this script is the safe production path.
 *
 * Usage: npm run db:indexes
 */

const { connect, disconnect, syncIndexes } = require('../config/database');
const models = require('../models');

async function run() {
  await connect();
  console.log('[indexes] connected');

  await syncIndexes();

  // Report what each collection ended up with, so a deploy log shows whether
  // the indexes this app depends on are actually present.
  for (const [name, model] of Object.entries(models)) {
    const indexes = await model.collection.indexes();
    console.log(`[indexes] ${name}: ${indexes.map((i) => i.name).join(', ')}`);
  }

  await disconnect();
  console.log('[indexes] done');
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[indexes] failed', error);
    process.exit(1);
  });
