'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');

const env = require('./config/env');
const { buildSessionMiddleware } = require('./config/session');
const { attachUser } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/api');
const webRoutes = require('./routes/web.routes');

/**
 * Builds the Express application.
 *
 * Exported as a factory rather than a singleton so the integration tests can
 * mount it against an in-memory MongoDB without booting a listener.
 */
function createApp({ mongoUrl = env.mongoUri } = {}) {
  const app = express();

  if (env.trustProxy) app.set('trust proxy', 1);

  /* ----------------------------- View layer ----------------------------- */
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layout');

  /* ------------------------------ Security ------------------------------ */
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          // Listing photos are seller-supplied URLs on third-party hosts.
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  /* ------------------------------ Plumbing ------------------------------ */
  app.use(compression());
  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: true, limit: '256kb' }));

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  app.use(
    express.static(path.join(__dirname, 'public'), {
      maxAge: env.isProduction ? '7d' : 0,
    })
  );

  /* ------------------------------ Identity ------------------------------ */
  app.use(buildSessionMiddleware(mongoUrl));
  app.use(attachUser);

  // Values every template needs.
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.query = req.query || {};
    next();
  });

  /* ------------------------------- Routes ------------------------------- */
  app.use('/api/v1', apiRoutes);
  app.use('/', webRoutes);

  /* ------------------------------- Errors ------------------------------- */
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
