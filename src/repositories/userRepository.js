'use strict';

const { User } = require('../models');

/** Data access for users. No authorization logic lives here. */

function create(data) {
  return User.create(data);
}

function findById(id, { lean = true } = {}) {
  const query = User.findById(id);
  return lean ? query.lean().exec() : query.exec();
}

/**
 * Looks up a user for sign-in.
 *
 * `passwordHash` is `select: false` on the schema, so it has to be asked for
 * explicitly — which keeps every other read of a user free of the hash.
 */
function findByEmailWithPassword(email) {
  return User.findOne({ email: String(email).toLowerCase() })
    .select('+passwordHash')
    .exec();
}

function findByEmail(email) {
  return User.findOne({ email: String(email).toLowerCase() }).exec();
}

function existsByEmail(email) {
  return User.exists({ email: String(email).toLowerCase() }).exec();
}

function updateById(id, updates) {
  return User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).exec();
}

function deleteById(id) {
  return User.findByIdAndDelete(id).exec();
}

async function paginate(filter = {}, { skip = 0, limit = 20 } = {}) {
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
    User.countDocuments(filter).exec(),
  ]);
  return { items, total };
}

module.exports = {
  create,
  findById,
  findByEmail,
  findByEmailWithPassword,
  existsByEmail,
  updateById,
  deleteById,
  paginate,
};
