'use strict';

const inquiryService = require('../services/inquiryService');
const asyncHandler = require('../middleware/asyncHandler');

const query = (req) => req.validatedQuery || req.query;

/** POST /api/v1/inquiries — buyers raise an inquiry on a listing. */
const create = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.createInquiry(
    req.user.id,
    req.body.listingId,
    req.body.message
  );
  res.status(201).json({ success: true, data: inquiry });
});

/** GET /api/v1/inquiries/received — seller inbox. */
const received = asyncHandler(async (req, res) => {
  const { items, meta } = await inquiryService.listReceived(
    req.user.id,
    query(req)
  );
  res.json({ success: true, data: items, meta });
});

/** GET /api/v1/inquiries/sent — buyer's own inquiries. */
const sent = asyncHandler(async (req, res) => {
  const { items, meta } = await inquiryService.listSent(req.user.id, query(req));
  res.json({ success: true, data: items, meta });
});

/** GET /api/v1/inquiries/:id */
const getOne = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.getInquiry(req.params.id, req.user);
  res.json({ success: true, data: inquiry });
});

/** PATCH /api/v1/inquiries/:id/read */
const markRead = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.markAsRead(req.params.id, req.user);
  res.json({ success: true, data: inquiry });
});

/** POST /api/v1/inquiries/:id/reply */
const reply = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.replyToInquiry(
    req.params.id,
    req.user,
    req.body.message
  );
  res.json({ success: true, data: inquiry });
});

/** DELETE /api/v1/inquiries/:id */
const remove = asyncHandler(async (req, res) => {
  const result = await inquiryService.deleteInquiry(req.params.id, req.user);
  res.json({ success: true, data: result });
});

module.exports = { create, received, sent, getOne, markRead, reply, remove };
