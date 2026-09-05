'use strict';

const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/** Catches anything that fell through the router. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
}

/**
 * Single exit point for every error.
 *
 * Deliberate `ApiError`s pass their message through; anything else is reported
 * as a generic 500, so an unexpected throw cannot leak a stack trace or a
 * driver message to the client.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, _next) {
  const normalized = normalize(error);

  if (!normalized.expected && !env.isTest) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
  }

  const wantsJson =
    req.originalUrl.startsWith('/api') ||
    req.xhr ||
    (req.get('accept') || '').includes('application/json');

  if (wantsJson) {
    return res.status(normalized.statusCode).json({
      success: false,
      error: {
        message: normalized.message,
        ...(normalized.details ? { details: normalized.details } : {}),
      },
    });
  }

  return res.status(normalized.statusCode).render('pages/error', {
    title: `${normalized.statusCode} — Something went wrong`,
    statusCode: normalized.statusCode,
    message: normalized.message,
  });
}

/** Maps framework and driver errors onto the ApiError shape. */
function normalize(error) {
  if (error instanceof ApiError) return error;

  // Mongoose schema validation.
  if (error.name === 'ValidationError') {
    return new ApiError(
      422,
      'Validation failed',
      Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }))
    );
  }

  // A malformed ObjectId in the path.
  if (error.name === 'CastError') {
    return new ApiError(400, `Invalid value for ${error.path}`);
  }

  // Unique index violation.
  if (error.code === 11000) {
    return new ApiError(409, 'That record already exists');
  }

  if (error.type === 'entity.too.large') {
    return new ApiError(413, 'Request body is too large');
  }

  const fallback = new ApiError(
    error.statusCode || 500,
    env.isProduction ? 'Something went wrong on our end' : error.message
  );
  fallback.expected = false;
  return fallback;
}

module.exports = { errorHandler, notFound };
