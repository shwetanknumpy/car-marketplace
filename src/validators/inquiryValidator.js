'use strict';

const { z } = require('zod');
const { INQUIRY_STATUS } = require('../utils/constants');
const { objectId, paginationSchema } = require('./common');

const createInquirySchema = z.object({
  listingId: objectId,
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be at most 2000 characters'),
});

const replySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Reply cannot be empty')
    .max(2000, 'Reply must be at most 2000 characters'),
});

const inquiryQuerySchema = paginationSchema.extend({
  status: z.enum(Object.values(INQUIRY_STATUS)).optional(),
  listingId: objectId.optional(),
});

module.exports = { createInquirySchema, replySchema, inquiryQuerySchema };
