'use strict';

const { z } = require('zod');
const {
  FUEL_TYPES,
  TRANSMISSIONS,
  LISTING_STATUS,
  LISTING_SORTS,
} = require('../utils/constants');
const { optionalInt, optionalTrimmed, paginationSchema } = require('./common');

const MAX_YEAR = new Date().getFullYear() + 1;

const numeric = (min, max, label) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => Number(value))
    .refine(
      (value) => Number.isFinite(value) && value >= min && value <= max,
      { message: `${label} must be between ${min} and ${max}` }
    );

const createListingSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(140),
  make: z.string().trim().min(1, 'Make is required').max(60),
  model: z.string().trim().min(1, 'Model is required').max(60),
  year: numeric(1900, MAX_YEAR, 'Year'),
  price: numeric(0, 100_000_000, 'Price'),
  mileage: numeric(0, 2_000_000, 'Mileage'),
  fuelType: z.enum(FUEL_TYPES).default('petrol'),
  transmission: z.enum(TRANSMISSIONS).default('manual'),
  location: z.string().trim().max(120).optional().default(''),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(4000),
  images: z
    .array(z.string().trim().url('Each image must be a valid URL'))
    .max(8, 'At most 8 images')
    .optional()
    .default([]),
  status: z
    .enum([LISTING_STATUS.DRAFT, LISTING_STATUS.ACTIVE])
    .default(LISTING_STATUS.DRAFT),
});

// Every field optional, but at least one has to be present.
const updateListingSchema = createListingSchema
  .partial()
  .extend({
    status: z.enum(Object.values(LISTING_STATUS)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

const updateStatusSchema = z.object({
  status: z.enum(Object.values(LISTING_STATUS)),
});

/** The multi-parameter search accepted by `GET /api/v1/listings`. */
const searchQuerySchema = paginationSchema.extend({
  q: optionalTrimmed(120),
  make: optionalTrimmed(60),
  model: optionalTrimmed(60),
  minYear: optionalInt(1900, MAX_YEAR),
  maxYear: optionalInt(1900, MAX_YEAR),
  minPrice: optionalInt(0),
  maxPrice: optionalInt(0),
  maxMileage: optionalInt(0),
  fuelType: z.enum(FUEL_TYPES).optional(),
  transmission: z.enum(TRANSMISSIONS).optional(),
  location: optionalTrimmed(120),
  sort: z.enum(Object.keys(LISTING_SORTS)).optional(),
});

const sellerListingQuerySchema = paginationSchema.extend({
  q: optionalTrimmed(120),
  make: optionalTrimmed(60),
  model: optionalTrimmed(60),
  status: z.enum(Object.values(LISTING_STATUS)).optional(),
  sort: z.enum(Object.keys(LISTING_SORTS)).optional(),
});

module.exports = {
  createListingSchema,
  updateListingSchema,
  updateStatusSchema,
  searchQuerySchema,
  sellerListingQuerySchema,
};
