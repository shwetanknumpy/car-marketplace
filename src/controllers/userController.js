'use strict';

const userService = require('../services/userService');
const asyncHandler = require('../middleware/asyncHandler');

const query = (req) => req.validatedQuery || req.query;

/** GET /api/v1/users/me */
const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.json({ success: true, data: user });
});

/** PATCH /api/v1/users/me */
const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  // Keep the session copy in step with the record just written.
  req.session.user = { ...req.session.user, name: user.name };
  res.json({ success: true, data: user });
});

/** POST /api/v1/users/me/become-seller */
const becomeSeller = asyncHandler(async (req, res) => {
  const user = await userService.becomeSeller(req.user.id);
  req.session.user = { ...req.session.user, role: user.role };
  res.json({ success: true, data: user });
});

/** DELETE /api/v1/users/me */
const deleteMe = asyncHandler(async (req, res, next) => {
  await userService.deleteAccount(req.user.id);
  req.session.destroy((error) => (error ? next(error) : res.json({ success: true })));
});

/** GET /api/v1/users/:id — public seller profile. */
const getPublic = asyncHandler(async (req, res) => {
  const user = await userService.getPublicProfile(req.params.id);
  res.json({ success: true, data: user });
});

/** GET /api/v1/users — admin only. */
const list = asyncHandler(async (req, res) => {
  const { items, meta } = await userService.listUsers(query(req));
  res.json({ success: true, data: items, meta });
});

module.exports = { getMe, updateMe, becomeSeller, deleteMe, getPublic, list };
