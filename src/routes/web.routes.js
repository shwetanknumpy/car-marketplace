'use strict';

const express = require('express');
const pageController = require('../controllers/pageController');
const validate = require('../middleware/validate');
const {
  requireGuest,
  requireAuthPage,
  requireSellerPage,
} = require('../middleware/auth');
const { idParam } = require('../validators/common');
const {
  searchQuerySchema,
  sellerListingQuerySchema,
} = require('../validators/listingValidator');
const { inquiryQuerySchema } = require('../validators/inquiryValidator');

const router = express.Router();

/* ------------------------------- Public --------------------------------- */

router.get('/', pageController.home);
router.get('/cars', validate({ query: searchQuerySchema }), pageController.browse);

router.get('/login', requireGuest, pageController.login);
router.get('/signup', requireGuest, pageController.signup);

/* ---------------------------- Seller workflow ---------------------------- */
// Placed before `/cars/:id` so "new" is matched as a literal, and gated so a
// buyer session is redirected or refused rather than shown the form.

router.get('/cars/new', requireSellerPage, pageController.newListing);
router.get(
  '/cars/:id/edit',
  requireSellerPage,
  validate({ params: idParam }),
  pageController.editListing
);

router.get(
  '/dashboard',
  requireSellerPage,
  validate({ query: sellerListingQuerySchema }),
  pageController.dashboard
);

router.get(
  '/dashboard/inquiries',
  requireSellerPage,
  validate({ query: inquiryQuerySchema }),
  pageController.dashboardInquiries
);

/* ----------------------------- Buyer workflow ---------------------------- */

router.get('/cars/:id', validate({ params: idParam }), pageController.listingDetail);

router.get(
  '/inquiries',
  requireAuthPage,
  validate({ query: inquiryQuerySchema }),
  pageController.myInquiries
);

router.get('/account', requireAuthPage, pageController.account);

module.exports = router;
