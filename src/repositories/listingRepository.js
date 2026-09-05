'use strict';

const { Listing } = require('../models');
const { LISTING_STATUS, LISTING_SORTS } = require('../utils/constants');

/**
 * Data access for listings.
 *
 * Nothing here makes policy decisions — no "is this user allowed to" checks and
 * no defaulting of business rules. Those live in the service layer, which keeps
 * this module a thin, directly testable wrapper over the collection.
 */

/**
 * Translates already-validated search inputs into a Mongo filter.
 *
 * The field order matters: `status`, `make` and `model` are equality matches
 * and `year`/`price` are ranges, which is exactly the shape the
 * `search_make_model_year_price` index is built for.
 */
function buildSearchFilter(criteria = {}) {
  const filter = {};

  // `status` has three meanings: absent falls back to the public default of
  // active-only, an explicit null means "any status" (the seller dashboard,
  // which must also show drafts and sold cars), and a value filters to it.
  if (criteria.status !== null) {
    filter.status = criteria.status || LISTING_STATUS.ACTIVE;
  }

  if (criteria.sellerId) filter['seller.id'] = criteria.sellerId;

  // Case-insensitive exact match on make/model. Anchored so the query is still
  // an equality-style predicate the compound index can serve, rather than an
  // unanchored substring scan.
  if (criteria.make) filter.make = new RegExp(`^${escapeRegex(criteria.make)}$`, 'i');
  if (criteria.model) filter.model = new RegExp(`^${escapeRegex(criteria.model)}$`, 'i');

  applyRange(filter, 'year', criteria.minYear, criteria.maxYear);
  applyRange(filter, 'price', criteria.minPrice, criteria.maxPrice);
  applyRange(filter, 'mileage', undefined, criteria.maxMileage);

  if (criteria.fuelType) filter.fuelType = criteria.fuelType;
  if (criteria.transmission) filter.transmission = criteria.transmission;
  if (criteria.location) {
    filter.location = new RegExp(escapeRegex(criteria.location), 'i');
  }
  if (criteria.q) filter.$text = { $search: criteria.q };

  return filter;
}

function applyRange(filter, field, min, max) {
  const range = {};
  if (min !== undefined && min !== null && min !== '') range.$gte = Number(min);
  if (max !== undefined && max !== null && max !== '') range.$lte = Number(max);
  if (Object.keys(range).length) filter[field] = range;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveSort(sortKey, hasTextSearch) {
  if (hasTextSearch && !sortKey) return { score: { $meta: 'textScore' } };
  return LISTING_SORTS[sortKey] || LISTING_SORTS.newest;
}

/**
 * Runs one page of a search plus its total count.
 *
 * The count is issued alongside the page rather than after it, and the page
 * itself is projected down to summary fields — see
 * `Listing.SUMMARY_PROJECTION` — so response size stays flat as the collection
 * grows.
 */
async function search(criteria = {}, { skip = 0, limit = 12, sort } = {}) {
  const filter = buildSearchFilter(criteria);
  const hasTextSearch = Boolean(criteria.q);

  const projection = { ...Listing.SUMMARY_PROJECTION };
  if (hasTextSearch) projection.score = { $meta: 'textScore' };

  const [items, total] = await Promise.all([
    Listing.find(filter, projection)
      .sort(resolveSort(sort, hasTextSearch))
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Listing.countDocuments(filter).exec(),
  ]);

  return { items, total };
}

function findById(id, { lean = true } = {}) {
  const query = Listing.findById(id);
  return lean ? query.lean().exec() : query.exec();
}

function create(data) {
  return Listing.create(data);
}

function updateById(id, updates) {
  return Listing.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).exec();
}

function deleteById(id) {
  return Listing.findByIdAndDelete(id).exec();
}

function countBySeller(sellerId, status) {
  const filter = { 'seller.id': sellerId };
  if (status) filter.status = status;
  return Listing.countDocuments(filter).exec();
}

/** Distinct makes among active listings, for the search form's dropdown. */
function distinctMakes() {
  return Listing.distinct('make', { status: LISTING_STATUS.ACTIVE }).exec();
}

function distinctModels(make) {
  const filter = { status: LISTING_STATUS.ACTIVE };
  if (make) filter.make = new RegExp(`^${escapeRegex(make)}$`, 'i');
  return Listing.distinct('model', filter).exec();
}

function incrementInquiryCount(listingId, delta = 1) {
  return Listing.updateOne(
    { _id: listingId },
    { $inc: { inquiryCount: delta } }
  ).exec();
}

function incrementViewCount(listingId) {
  return Listing.updateOne({ _id: listingId }, { $inc: { viewCount: 1 } }).exec();
}

/** Fans a profile change out to the seller snapshot on each of their listings. */
function updateSellerSnapshot(sellerId, snapshot) {
  return Listing.updateMany(
    { 'seller.id': sellerId },
    {
      $set: {
        'seller.name': snapshot.name,
        'seller.email': snapshot.email,
        'seller.phone': snapshot.phone || '',
      },
    }
  ).exec();
}

function deleteBySeller(sellerId) {
  return Listing.deleteMany({ 'seller.id': sellerId }).exec();
}

module.exports = {
  buildSearchFilter,
  search,
  findById,
  create,
  updateById,
  deleteById,
  countBySeller,
  distinctMakes,
  distinctModels,
  incrementInquiryCount,
  incrementViewCount,
  updateSellerSnapshot,
  deleteBySeller,
};
