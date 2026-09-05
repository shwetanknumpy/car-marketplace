'use strict';

const express = require('express');
const listingController = require('../../controllers/listingController');
const validate = require('../../middleware/validate');
const { requireAuth, requireSeller } = require('../../middleware/auth');
const { writeLimiter } = require('../../middleware/rateLimit');
const { idParam } = require('../../validators/common');
const {
  createListingSchema,
  updateListingSchema,
  updateStatusSchema,
  searchQuerySchema,
  sellerListingQuerySchema,
} = require('../../validators/listingValidator');

const router = express.Router();

/* ----------------------------- Public reads ----------------------------- */

router.get('/', validate({ query: searchQuerySchema }), listingController.search);
router.get('/filters', listingController.filters);

/* --------------------------- Seller-only reads --------------------------- */
// Declared before `/:id` so "mine" and "stats" are not swallowed as ids.

router.get(
  '/mine',
  requireAuth,
  requireSeller,
  validate({ query: sellerListingQuerySchema }),
  listingController.mine
);

router.get('/stats', requireAuth, requireSeller, listingController.stats);

router.get('/:id', validate({ params: idParam }), listingController.getOne);

/* -------------------------- Seller-only writes --------------------------- */
// Every route below asserts a seller session; the service then asserts that
// this seller owns the specific listing.

router.post(
  '/',
  requireAuth,
  requireSeller,
  writeLimiter,
  validate({ body: createListingSchema }),
  listingController.create
);

router.patch(
  '/:id',
  requireAuth,
  requireSeller,
  writeLimiter,
  validate({ params: idParam, body: updateListingSchema }),
  listingController.update
);

router.patch(
  '/:id/status',
  requireAuth,
  requireSeller,
  validate({ params: idParam, body: updateStatusSchema }),
  listingController.updateStatus
);

router.delete(
  '/:id',
  requireAuth,
  requireSeller,
  validate({ params: idParam }),
  listingController.remove
);

module.exports = router;
