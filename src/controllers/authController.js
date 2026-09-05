'use strict';

const authService = require('../services/authService');
const userService = require('../services/userService');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/**
 * Controllers stay thin: read the (already validated) request, call a service,
 * shape a response. No business rules and no database access live here, which
 * is what lets the services be tested without an HTTP layer.
 */

/** POST /api/v1/auth/register */
const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  await establishSession(req, user);

  res.status(201).json({
    success: true,
    data: { user: userService.sanitize(user) },
  });
});

/** POST /api/v1/auth/login */
const login = asyncHandler(async (req, res) => {
  const user = await authService.authenticate(req.body);
  await establishSession(req, user);

  res.json({ success: true, data: { user: userService.sanitize(user) } });
});

/** POST /api/v1/auth/logout */
const logout = asyncHandler(async (req, res, next) => {
  if (!req.session) return res.json({ success: true });

  return req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie(env.session.name);
    return res.json({ success: true });
  });
});

/** GET /api/v1/auth/me */
const me = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const profile = await userService.getProfile(req.user.id);
  res.json({ success: true, data: { user: profile } });
});

/** POST /api/v1/auth/password */
const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  res.json({ success: true, data: { message: 'Password updated' } });
});

/**
 * Writes the authenticated identity into a fresh session.
 *
 * The session id is regenerated first so a pre-auth id cannot be reused after
 * privileges change (session fixation).
 */
function establishSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);

      req.session.user = authService.toSessionUser(user);
      return req.session.save((saveError) =>
        saveError ? reject(saveError) : resolve()
      );
    });
  });
}

module.exports = { register, login, logout, me, changePassword, establishSession };
