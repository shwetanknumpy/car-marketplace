'use strict';

const { z } = require('zod');
const { ROLES } = require('../utils/constants');
const { paginationSchema, optionalTrimmed } = require('./common');

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required').max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    location: z.string().trim().max(120).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

const userQuerySchema = paginationSchema.extend({
  role: z.enum(Object.values(ROLES)).optional(),
  q: optionalTrimmed(120),
});

module.exports = { updateProfileSchema, userQuerySchema };
