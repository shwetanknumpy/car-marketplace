'use strict';

const mongoose = require('mongoose');
const { INQUIRY_STATUS } = require('../utils/constants');

/**
 * A buyer's message about one listing.
 *
 * Both inboxes — the seller's ("inquiries on my cars") and the buyer's
 * ("inquiries I sent") — render a list of rows showing the car and the other
 * party. Denormalizing that handful of fields keeps each inbox a single
 * indexed find rather than a find plus two rounds of population.
 */
const inquirySchema = new mongoose.Schema(
  {
    listing: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true,
      },
      title: { type: String, required: true, trim: true },
      price: { type: Number, required: true, min: 0 },
      image: { type: String, default: null },
    },
    buyer: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, trim: true, default: '' },
    },
    // The listing owner at the time of the inquiry; kept flat so the seller
    // inbox query hits an index on a single field.
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: Object.values(INQUIRY_STATUS),
      default: INQUIRY_STATUS.UNREAD,
    },
    reply: {
      message: { type: String, trim: true, maxlength: 2000, default: '' },
      repliedAt: { type: Date, default: null },
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

// Seller inbox, optionally narrowed to unread, newest first.
inquirySchema.index(
  { sellerId: 1, status: 1, createdAt: -1 },
  { name: 'seller_inbox' }
);

// Buyer's sent list, newest first.
inquirySchema.index({ 'buyer.id': 1, createdAt: -1 }, { name: 'buyer_sent' });

// Thread of inquiries on one listing.
inquirySchema.index({ 'listing.id': 1, createdAt: -1 }, { name: 'listing_thread' });

// One open inquiry per buyer per listing, enforced by the database rather than
// by an application-level existence check that two concurrent posts could pass.
inquirySchema.index(
  { 'listing.id': 1, 'buyer.id': 1 },
  { name: 'unique_buyer_listing', unique: true }
);

module.exports = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);
