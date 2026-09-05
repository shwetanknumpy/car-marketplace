'use strict';

const express = require('express');
const inquiryController = require('../../controllers/inquiryController');
const validate = require('../../middleware/validate');
const { requireAuth, requireSeller } = require('../../middleware/auth');
const { writeLimiter } = require('../../middleware/rateLimit');
const { idParam } = require('../../validators/common');
const {
  createInquirySchema,
  replySchema,
  inquiryQuerySchema,
} = require('../../validators/inquiryValidator');

const router = express.Router();

// Every inquiry route needs a session; the two workflows diverge below.
router.use(requireAuth);

/* ------------------------------ Buyer side ------------------------------ */

router.post(
  '/',
  writeLimiter,
  validate({ body: createInquirySchema }),
  inquiryController.create
);

router.get(
  '/sent',
  validate({ query: inquiryQuerySchema }),
  inquiryController.sent
);

/* ------------------------------ Seller side ------------------------------ */

router.get(
  '/received',
  requireSeller,
  validate({ query: inquiryQuerySchema }),
  inquiryController.received
);

router.patch(
  '/:id/read',
  requireSeller,
  validate({ params: idParam }),
  inquiryController.markRead
);

router.post(
  '/:id/reply',
  requireSeller,
  writeLimiter,
  validate({ params: idParam, body: replySchema }),
  inquiryController.reply
);

/* ------------------------- Either party, if theirs ------------------------ */

router.get('/:id', validate({ params: idParam }), inquiryController.getOne);
router.delete('/:id', validate({ params: idParam }), inquiryController.remove);

module.exports = router;
