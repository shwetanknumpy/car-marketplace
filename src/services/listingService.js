'use strict';

const listingRepository = require('../repositories/listingRepository');
const inquiryRepository = require('../repositories/inquiryRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const { resolvePagination, buildMeta } = require('../utils/pagination');
const { ROLES, LISTING_STATUS } = require('../utils/constants');

/**
 * Listing business rules.
 *
 * Ownership is re-checked here on every mutation. Route middleware already
 * proves the caller is a seller, but only this layer knows whether they are
 * *this listing's* seller, so the check cannot be skipped by reaching an
 * endpoint through a different route.
 */

const EDITABLE_FIELDS = [
  'title',
  'make',
  'model',
  'year',
  'price',
  'mileage',
  'fuelType',
  'transmission',
  'location',
  'description',
  'images',
  'status',
];

/** Public, paginated search. Only ever returns active listings. */
async function searchListings(query = {}) {
  const { page, limit, skip } = resolvePagination(query);

  const { items, total } = await listingRepository.search(
    { ...query, status: LISTING_STATUS.ACTIVE, sellerId: undefined },
    { skip, limit, sort: query.sort }
  );

  return { items, meta: buildMeta({ page, limit, total }) };
}

/**
 * A seller's own listings, including drafts and sold cars.
 *
 * Callers pass the seller id from the session, never from the request body.
 */
async function listSellerListings(sellerId, query = {}) {
  const { page, limit, skip } = resolvePagination(query);

  const { items, total } = await listingRepository.search(
    {
      sellerId,
      // `status: null` widens the filter past the default 'active'.
      status: query.status || null,
      make: query.make,
      model: query.model,
      q: query.q,
    },
    { skip, limit, sort: query.sort }
  );

  return { items, meta: buildMeta({ page, limit, total }) };
}

async function getListingById(id, { viewer = null, countView = false } = {}) {
  const listing = await listingRepository.findById(id);
  if (!listing) throw ApiError.notFound('Listing not found');

  const isOwner = viewer && String(listing.seller.id) === String(viewer.id);
  const isAdmin = viewer && viewer.role === ROLES.ADMIN;

  // Drafts are private to their seller; a direct URL is not a way around that.
  if (listing.status === LISTING_STATUS.DRAFT && !isOwner && !isAdmin) {
    throw ApiError.notFound('Listing not found');
  }

  if (countView && !isOwner) {
    // Fire-and-forget: a failed counter must not fail the page.
    listingRepository.incrementViewCount(id).catch(() => {});
  }

  return listing;
}

async function createListing(sellerId, payload) {
  const seller = await userRepository.findById(sellerId, { lean: false });
  if (!seller) throw ApiError.notFound('Seller account not found');
  if (!seller.isSeller()) {
    throw ApiError.forbidden('Only seller accounts can publish listings');
  }

  return listingRepository.create({
    ...pick(payload, EDITABLE_FIELDS),
    status: payload.status || LISTING_STATUS.DRAFT,
    seller: seller.toContactSnapshot(),
  });
}

async function updateListing(listingId, actor, payload) {
  const listing = await requireOwnedListing(listingId, actor);

  const updates = pick(payload, EDITABLE_FIELDS);
  if (!Object.keys(updates).length) {
    throw ApiError.badRequest('No updatable fields were provided');
  }

  return listingRepository.updateById(listing._id, { $set: updates });
}

async function updateStatus(listingId, actor, status) {
  await requireOwnedListing(listingId, actor);
  return listingRepository.updateById(listingId, { $set: { status } });
}

async function deleteListing(listingId, actor) {
  const listing = await requireOwnedListing(listingId, actor);

  await listingRepository.deleteById(listing._id);
  // Inquiries reference a listing that no longer exists; drop them so neither
  // inbox renders a dangling row.
  await inquiryRepository.deleteByListing(listing._id);

  return { id: String(listing._id) };
}

/**
 * Loads a listing and asserts the actor may modify it.
 *
 * Every seller-only mutation funnels through here, so there is one place where
 * "can this account touch this record" is decided.
 */
async function requireOwnedListing(listingId, actor) {
  if (!actor) throw ApiError.unauthorized();

  const listing = await listingRepository.findById(listingId);
  if (!listing) throw ApiError.notFound('Listing not found');

  const isOwner = String(listing.seller.id) === String(actor.id);
  const isAdmin = actor.role === ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('You can only manage your own listings');
  }

  return listing;
}

/** Options that populate the search form. */
async function getFilterOptions(make) {
  const [makes, models] = await Promise.all([
    listingRepository.distinctMakes(),
    make ? listingRepository.distinctModels(make) : Promise.resolve([]),
  ]);
  return { makes: makes.sort(), models: models.sort() };
}

async function getSellerStats(sellerId) {
  const [total, active, sold, drafts, inquiries, unread] = await Promise.all([
    listingRepository.countBySeller(sellerId),
    listingRepository.countBySeller(sellerId, LISTING_STATUS.ACTIVE),
    listingRepository.countBySeller(sellerId, LISTING_STATUS.SOLD),
    listingRepository.countBySeller(sellerId, LISTING_STATUS.DRAFT),
    inquiryRepository.countForSeller(sellerId),
    inquiryRepository.countForSeller(sellerId, 'unread'),
  ]);

  return { total, active, sold, drafts, inquiries, unread };
}

function pick(source, keys) {
  return keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});
}

module.exports = {
  searchListings,
  listSellerListings,
  getListingById,
  createListing,
  updateListing,
  updateStatus,
  deleteListing,
  requireOwnedListing,
  getFilterOptions,
  getSellerStats,
};
