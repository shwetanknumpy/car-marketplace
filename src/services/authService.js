'use strict';

const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');
const { ROLES } = require('../utils/constants');

/**
 * Account creation and credential checking.
 *
 * Passwords only ever exist here as plain text; everything downstream sees the
 * bcrypt hash, which the schema also refuses to select by default.
 */

async function register({ name, email, password, role, phone, location }) {
  const normalizedEmail = String(email).toLowerCase().trim();

  if (await userRepository.existsByEmail(normalizedEmail)) {
    throw ApiError.conflict('An account with that email already exists');
  }

  const passwordHash = await User.hashPassword(password);

  try {
    const user = await userRepository.create({
      name,
      email: normalizedEmail,
      passwordHash,
      // Only buyer and seller are self-selectable; admin is assigned out of band.
      role: role === ROLES.SELLER ? ROLES.SELLER : ROLES.BUYER,
      phone: phone || '',
      location: location || '',
    });
    return user;
  } catch (error) {
    // The unique index is the real guard — the check above just gives a nicer
    // message in the common, uncontended case.
    if (error.code === 11000) {
      throw ApiError.conflict('An account with that email already exists');
    }
    throw error;
  }
}

/**
 * Verifies credentials.
 *
 * A missing account and a wrong password produce the same error, so the
 * response cannot be used to enumerate registered addresses.
 */
async function authenticate({ email, password }) {
  const user = await userRepository.findByEmailWithPassword(email);

  if (!user) {
    // Still spend the time a real comparison would, so response latency does
    // not reveal whether the address exists.
    await User.hashPassword(password);
    throw ApiError.unauthorized('Invalid email or password');
  }

  const matches = await user.verifyPassword(password);
  if (!matches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return user;
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash').exec();
  if (!user) throw ApiError.notFound('Account not found');

  const matches = await user.verifyPassword(currentPassword);
  if (!matches) throw ApiError.badRequest('Current password is incorrect');

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();
  return user;
}

/** The subset of the user record that gets written into the session. */
function toSessionUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

module.exports = { register, authenticate, changePassword, toSessionUser };
