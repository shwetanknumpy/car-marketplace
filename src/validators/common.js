'use strict';

const { z } = require('zod');

/** Reusable primitives shared by the per-resource schemas. */

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');

const idParam = z.object({ id: objectId });

/** Query strings arrive as strings; these coerce and bound them. */
const optionalInt = (min, max) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) =>
      value === undefined || value === '' ? undefined : Number(value)
    )
    .refine(
      (value) =>
        value === undefined ||
        (Number.isFinite(value) &&
          (min === undefined || value >= min) &&
          (max === undefined || value <= max)),
      { message: 'Must be a number in range' }
    );

const optionalTrimmed = (max = 120) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

/**
 * page/limit.
 *
 * These check shape only — that the values are positive integers. The policy
 * cap on page size belongs to `utils/pagination`, which clamps an oversized
 * `limit` down to `MAX_PAGE_SIZE` rather than rejecting the request, so a
 * client asking for too much still gets a bounded page back.
 */
const paginationSchema = z.object({
  page: optionalInt(1),
  limit: optionalInt(1),
});

module.exports = {
  objectId,
  idParam,
  optionalInt,
  optionalTrimmed,
  paginationSchema,
};
