'use strict';

const mongoose = require('mongoose');
const {
  LISTING_STATUS,
  FUEL_TYPES,
  TRANSMISSIONS,
} = require('../utils/constants');

/**
 * Seller contact details are denormalized onto every listing.
 *
 * The dominant read on this platform is the search results page: dozens of
 * listing cards, each of which shows the seller's name. Embedding the snapshot
 * means that page is a single indexed find with no per-card lookup into
 * `users`. The trade is that a seller renaming themselves has to fan out to
 * their listings, which `listingRepository.updateSellerSnapshot` handles and
 * which happens orders of magnitude less often than a search.
 */
const sellerSnapshotSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 140,
    },
    make: {
      type: String,
      required: [true, 'Make is required'],
      trim: true,
      maxlength: 60,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
      maxlength: 60,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    mileage: {
      type: Number,
      required: [true, 'Mileage is required'],
      min: 0,
    },
    fuelType: {
      type: String,
      enum: FUEL_TYPES,
      default: 'petrol',
    },
    transmission: {
      type: String,
      enum: TRANSMISSIONS,
      default: 'manual',
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 4000,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 8,
        message: 'A listing can carry at most 8 images',
      },
    },
    status: {
      type: String,
      enum: Object.values(LISTING_STATUS),
      default: LISTING_STATUS.DRAFT,
    },
    seller: {
      type: sellerSnapshotSchema,
      required: true,
    },
    inquiryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

/* ------------------------------------------------------------------------ *
 * Indexes
 *
 * Every buyer-facing query is filtered by `status: 'active'`, so it leads each
 * compound index. After that the fields are ordered equality -> sort -> range,
 * which is what lets MongoDB satisfy filter and sort from one index instead of
 * loading matches into memory to sort them.
 * ------------------------------------------------------------------------ */

// Primary search index: the full make/model/year/price query buyers run.
// A `make`-only or `make + model` filter uses this same index via its prefix.
listingSchema.index(
  { status: 1, make: 1, model: 1, year: -1, price: 1 },
  { name: 'search_make_model_year_price' }
);

// Price-led browsing ("everything under 15k, cheapest first"), where no
// make/model is supplied and the prefix of the index above would not apply.
listingSchema.index(
  { status: 1, price: 1, year: -1 },
  { name: 'search_price_year' }
);

// Default landing view: active listings, newest first.
listingSchema.index({ status: 1, createdAt: -1 }, { name: 'browse_recent' });

// Seller dashboard: one seller's listings across every status, newest first.
listingSchema.index(
  { 'seller.id': 1, status: 1, createdAt: -1 },
  { name: 'seller_dashboard' }
);

// Free-text keyword search across the human-written fields.
listingSchema.index(
  { title: 'text', description: 'text', make: 'text', model: 'text' },
  {
    name: 'listing_text',
    weights: { title: 10, make: 6, model: 6, description: 1 },
  }
);

listingSchema.virtual('primaryImage').get(function primaryImage() {
  return this.images && this.images.length ? this.images[0] : null;
});

listingSchema.methods.isOwnedBy = function isOwnedBy(userId) {
  return String(this.seller.id) === String(userId);
};

/**
 * Field set returned by list endpoints.
 *
 * Search results omit `description` and the full image array; a results page
 * therefore costs roughly the same bytes per listing no matter how much prose
 * a seller wrote.
 */
listingSchema.statics.SUMMARY_PROJECTION = {
  title: 1,
  make: 1,
  model: 1,
  year: 1,
  price: 1,
  mileage: 1,
  fuelType: 1,
  transmission: 1,
  location: 1,
  status: 1,
  images: { $slice: 1 },
  'seller.id': 1,
  'seller.name': 1,
  inquiryCount: 1,
  createdAt: 1,
};

module.exports = mongoose.models.Listing || mongoose.model('Listing', listingSchema);
