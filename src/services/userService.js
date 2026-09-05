'use strict';

const userRepository = require('../repositories/userRepository');
const listingRepository = require('../repositories/listingRepository');
const ApiError = require('../utils/ApiError');
const { resolvePagination, buildMeta } = require('../utils/pagination');
const { ROLES } = require('../utils/constants');

/** Profile reads and updates, plus the admin-only directory. */

async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');
  return sanitize(user);
}

/**
 * Public seller profile.
 *
 * Deliberately narrower than `getProfile`: a stranger sees the seller's
 * display details, not their full record.
 */
async function getPublicProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');

  return {
    id: String(user._id),
    name: user.name,
    role: user.role,
    location: user.location || '',
    memberSince: user.createdAt,
  };
}

const EDITABLE_FIELDS = ['name', 'phone', 'location'];

async function updateProfile(userId, payload) {
  const updates = EDITABLE_FIELDS.reduce((acc, key) => {
    if (payload[key] !== undefined) acc[key] = payload[key];
    return acc;
  }, {});

  if (!Object.keys(updates).length) {
    throw ApiError.badRequest('No updatable fields were provided');
  }

  const user = await userRepository.updateById(userId, { $set: updates });
  if (!user) throw ApiError.notFound('Account not found');

  // Keep the snapshots denormalized onto this seller's listings in step with
  // the profile they just changed.
  await listingRepository.updateSellerSnapshot(user._id, {
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  return sanitize(user);
}

/**
 * Lets a buyer account start selling.
 *
 * Upgrading is one-way through this path — nothing here grants admin.
 */
async function becomeSeller(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');

  if (user.role === ROLES.SELLER || user.role === ROLES.ADMIN) {
    return sanitize(user);
  }

  const updated = await userRepository.updateById(userId, {
    $set: { role: ROLES.SELLER },
  });

  return sanitize(updated);
}

async function listUsers(query = {}) {
  const { page, limit, skip } = resolvePagination(query);

  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.q) {
    const pattern = new RegExp(String(query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const { items, total } = await userRepository.paginate(filter, { skip, limit });

  return {
    items: items.map(sanitize),
    meta: buildMeta({ page, limit, total }),
  };
}

async function deleteAccount(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');

  await listingRepository.deleteBySeller(userId);
  await userRepository.deleteById(userId);

  return { id: String(userId) };
}

function sanitize(user) {
  if (!user) return user;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete plain.passwordHash;
  delete plain.__v;
  return plain;
}

module.exports = {
  getProfile,
  getPublicProfile,
  updateProfile,
  becomeSeller,
  listUsers,
  deleteAccount,
  sanitize,
};
