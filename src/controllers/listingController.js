'use strict';

const listingService = require('../services/listingService');
const asyncHandler = require('../middleware/asyncHandler');

const query = (req) => req.validatedQuery || req.query;

/** GET /api/v1/listings — public multi-parameter search, paginated. */
const search = asyncHandler(async (req, res) => {
  const { items, meta } = await listingService.searchListings(query(req));
  res.json({ success: true, data: items, meta });
});

/** GET /api/v1/listings/filters */
const filters = asyncHandler(async (req, res) => {
  const options = await listingService.getFilterOptions(query(req).make);
  res.json({ success: true, data: options });
});

/** GET /api/v1/listings/mine — the caller's own listings, drafts included. */
const mine = asyncHandler(async (req, res) => {
  const { items, meta } = await listingService.listSellerListings(
    req.user.id,
    query(req)
  );
  res.json({ success: true, data: items, meta });
});

/** GET /api/v1/listings/:id */
const getOne = asyncHandler(async (req, res) => {
  const listing = await listingService.getListingById(req.params.id, {
    viewer: req.user,
    countView: true,
  });
  res.json({ success: true, data: listing });
});

/** POST /api/v1/listings — seller only. */
const create = asyncHandler(async (req, res) => {
  const listing = await listingService.createListing(req.user.id, req.body);
  res.status(201).json({ success: true, data: listing });
});

/** PATCH /api/v1/listings/:id — seller only, owner enforced in the service. */
const update = asyncHandler(async (req, res) => {
  const listing = await listingService.updateListing(
    req.params.id,
    req.user,
    req.body
  );
  res.json({ success: true, data: listing });
});

/** PATCH /api/v1/listings/:id/status */
const updateStatus = asyncHandler(async (req, res) => {
  const listing = await listingService.updateStatus(
    req.params.id,
    req.user,
    req.body.status
  );
  res.json({ success: true, data: listing });
});

/** DELETE /api/v1/listings/:id */
const remove = asyncHandler(async (req, res) => {
  const result = await listingService.deleteListing(req.params.id, req.user);
  res.json({ success: true, data: result });
});

/** GET /api/v1/listings/stats — dashboard counters. */
const stats = asyncHandler(async (req, res) => {
  const data = await listingService.getSellerStats(req.user.id);
  res.json({ success: true, data });
});

module.exports = {
  search,
  filters,
  mine,
  getOne,
  create,
  update,
  updateStatus,
  remove,
  stats,
};
