'use strict';

const { Inquiry } = require('../models');

/** Data access for inquiries. */

function create(data) {
  return Inquiry.create(data);
}

function findById(id, { lean = true } = {}) {
  const query = Inquiry.findById(id);
  return lean ? query.lean().exec() : query.exec();
}

async function paginate(filter = {}, { skip = 0, limit = 20 } = {}) {
  const [items, total] = await Promise.all([
    Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Inquiry.countDocuments(filter).exec(),
  ]);
  return { items, total };
}

function updateById(id, updates) {
  return Inquiry.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).exec();
}

function deleteById(id) {
  return Inquiry.findByIdAndDelete(id).exec();
}

function countForSeller(sellerId, status) {
  const filter = { sellerId };
  if (status) filter.status = status;
  return Inquiry.countDocuments(filter).exec();
}

function existsForBuyerAndListing(buyerId, listingId) {
  return Inquiry.exists({ 'buyer.id': buyerId, 'listing.id': listingId }).exec();
}

function deleteByListing(listingId) {
  return Inquiry.deleteMany({ 'listing.id': listingId }).exec();
}

module.exports = {
  create,
  findById,
  paginate,
  updateById,
  deleteById,
  countForSeller,
  existsForBuyerAndListing,
  deleteByListing,
};
