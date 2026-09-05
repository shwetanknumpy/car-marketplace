'use strict';

const listingService = require('../services/listingService');
const inquiryService = require('../services/inquiryService');
const userService = require('../services/userService');
const asyncHandler = require('../middleware/asyncHandler');
const { LISTING_STATUS, FUEL_TYPES, TRANSMISSIONS } = require('../utils/constants');

/**
 * Renders the server-side pages.
 *
 * These handlers call the same services the JSON API does, so a page and its
 * corresponding endpoint can never drift on what a user is allowed to see.
 * Page GETs render; all mutations go through the REST API via fetch.
 */

const query = (req) => req.validatedQuery || req.query;

const home = asyncHandler(async (req, res) => {
  const [{ items }, options] = await Promise.all([
    listingService.searchListings({ limit: 6, sort: 'newest' }),
    listingService.getFilterOptions(),
  ]);

  res.render('pages/home', {
    title: 'AutoMarket — Buy and sell used cars',
    listings: items,
    makes: options.makes,
  });
});

const browse = asyncHandler(async (req, res) => {
  const searchParams = query(req);

  const [{ items, meta }, options] = await Promise.all([
    listingService.searchListings(searchParams),
    listingService.getFilterOptions(searchParams.make),
  ]);

  res.render('pages/listings/index', {
    title: 'Browse cars',
    listings: items,
    meta,
    filters: searchParams,
    makes: options.makes,
    models: options.models,
    fuelTypes: FUEL_TYPES,
    transmissions: TRANSMISSIONS,
  });
});

const listingDetail = asyncHandler(async (req, res) => {
  const listing = await listingService.getListingById(req.params.id, {
    viewer: req.user,
    countView: true,
  });

  res.render('pages/listings/show', {
    title: listing.title,
    listing,
    canInquire:
      Boolean(req.user) &&
      String(listing.seller.id) !== String(req.user.id) &&
      listing.status === LISTING_STATUS.ACTIVE,
  });
});

const newListing = (_req, res) =>
  res.render('pages/listings/new', {
    title: 'Post a car',
    fuelTypes: FUEL_TYPES,
    transmissions: TRANSMISSIONS,
    statuses: [LISTING_STATUS.DRAFT, LISTING_STATUS.ACTIVE],
  });

const editListing = asyncHandler(async (req, res) => {
  // Loads through the ownership check, so a seller cannot open the edit form
  // for someone else's car by guessing the id.
  const listing = await listingService.requireOwnedListing(req.params.id, req.user);

  res.render('pages/listings/edit', {
    title: `Edit — ${listing.title}`,
    listing,
    fuelTypes: FUEL_TYPES,
    transmissions: TRANSMISSIONS,
    statuses: Object.values(LISTING_STATUS),
  });
});

const dashboard = asyncHandler(async (req, res) => {
  const searchParams = query(req);

  const [{ items, meta }, stats] = await Promise.all([
    listingService.listSellerListings(req.user.id, searchParams),
    listingService.getSellerStats(req.user.id),
  ]);

  res.render('pages/dashboard/index', {
    title: 'Seller dashboard',
    listings: items,
    meta,
    stats,
    filters: searchParams,
    statuses: Object.values(LISTING_STATUS),
  });
});

const dashboardInquiries = asyncHandler(async (req, res) => {
  const searchParams = query(req);
  const { items, meta } = await inquiryService.listReceived(req.user.id, searchParams);

  res.render('pages/dashboard/inquiries', {
    title: 'Inquiries received',
    inquiries: items,
    meta,
    filters: searchParams,
  });
});

const myInquiries = asyncHandler(async (req, res) => {
  const searchParams = query(req);
  const { items, meta } = await inquiryService.listSent(req.user.id, searchParams);

  res.render('pages/inquiries/index', {
    title: 'My inquiries',
    inquiries: items,
    meta,
  });
});

const account = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user.id);
  res.render('pages/account', { title: 'My account', profile });
});

const login = (req, res) =>
  res.render('pages/auth/login', {
    title: 'Sign in',
    returnTo: typeof req.query.returnTo === 'string' ? req.query.returnTo : '/',
  });

const signup = (_req, res) =>
  res.render('pages/auth/signup', { title: 'Create an account' });

module.exports = {
  home,
  browse,
  listingDetail,
  newListing,
  editListing,
  dashboard,
  dashboardInquiries,
  myInquiries,
  account,
  login,
  signup,
};
