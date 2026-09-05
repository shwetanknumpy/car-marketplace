'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Validates a request against Zod schemas and replaces the raw input with the
 * parsed result.
 *
 * Handlers downstream therefore work with coerced, whitelisted values — a
 * `price` is a number, an unknown field never reaches the database.
 */
module.exports = function validate(schemas = {}) {
  return function validateRequest(req, _res, next) {
    try {
      for (const source of ['body', 'query', 'params']) {
        const schema = schemas[source];
        if (!schema) continue;

        const result = schema.safeParse(req[source]);
        if (!result.success) {
          return next(
            ApiError.unprocessable('Validation failed', formatIssues(result.error))
          );
        }

        // `req.query` has only a getter on Express 5; assigning to a private
        // field keeps this working on both major versions.
        if (source === 'query') {
          req.validatedQuery = result.data;
          try {
            req.query = result.data;
          } catch {
            /* Express 5: read-only getter, validatedQuery is the source of truth */
          }
        } else {
          req[source] = result.data;
        }
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

function formatIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}
