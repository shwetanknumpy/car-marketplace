'use strict';

const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

/**
 * Session-backed authentication and role checks.
 *
 * The session cookie is the only source of identity. Nothing reads a user id
 * or a role out of the request body, query string or a header, so a buyer
 * cannot reach a seller endpoint by editing a URL or forging a field — the
 * check always runs against what the server itself stored at sign-in.
 */

/** Makes the signed-in user available to handlers and to every view. */
function attachUser(req, res, next) {
  req.user = req.session && req.session.user ? req.session.user : null;
  res.locals.currentUser = req.user;
  next();
}

/** Rejects anonymous callers. */
function requireAuth(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized());
  return next();
}

/**
 * Rejects callers whose session role is not in `allowed`.
 *
 * Admin passes every role gate.
 */
function requireRole(...allowed) {
  const permitted = new Set(allowed.flat());

  return function roleGuard(req, _res, next) {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === ROLES.ADMIN) return next();
    if (!permitted.has(req.user.role)) {
      return next(
        ApiError.forbidden(
          `This action requires a ${[...permitted].join(' or ')} account`
        )
      );
    }
    return next();
  };
}

/** Shorthand for the seller-only surface. */
const requireSeller = requireRole(ROLES.SELLER);

/** Shorthand for the buyer-only surface (raising inquiries). */
const requireBuyer = requireRole(ROLES.BUYER);

const requireAdmin = requireRole(ROLES.ADMIN);

/** Keeps signed-in users off the login and signup pages. */
function requireGuest(req, res, next) {
  if (req.user) return res.redirect('/');
  return next();
}

/**
 * Page-route variant of `requireAuth`: bounces to the login form and
 * remembers where the visitor was heading.
 */
function requireAuthPage(req, res, next) {
  if (req.user) return next();
  const returnTo = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?returnTo=${returnTo}`);
}

/** Page-route variant of `requireSeller`. */
function requireSellerPage(req, res, next) {
  if (!req.user) {
    const returnTo = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login?returnTo=${returnTo}`);
  }
  if (req.user.role === ROLES.SELLER || req.user.role === ROLES.ADMIN) {
    return next();
  }
  return next(ApiError.forbidden('This page is only available to seller accounts'));
}

module.exports = {
  attachUser,
  requireAuth,
  requireRole,
  requireSeller,
  requireBuyer,
  requireAdmin,
  requireGuest,
  requireAuthPage,
  requireSellerPage,
};
