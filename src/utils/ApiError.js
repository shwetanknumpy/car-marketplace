'use strict';

/**
 * Errors the application raises deliberately, as opposed to crashes.
 *
 * The error handler trusts `statusCode` and `message` on these and leaks
 * nothing for anything else, so services can throw freely without worrying
 * about what reaches the client.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.expected = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'You must be signed in to do that') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You are not allowed to do that') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'Validation failed', details) {
    return new ApiError(422, message, details);
  }
}

module.exports = ApiError;
