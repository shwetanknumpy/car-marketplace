'use strict';

/** Roles drive every authorization decision in the app. */
const ROLES = Object.freeze({
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
});

const LISTING_STATUS = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  SOLD: 'sold',
});

const INQUIRY_STATUS = Object.freeze({
  UNREAD: 'unread',
  READ: 'read',
  REPLIED: 'replied',
});

const FUEL_TYPES = Object.freeze([
  'petrol',
  'diesel',
  'hybrid',
  'electric',
  'cng',
  'lpg',
]);

const TRANSMISSIONS = Object.freeze(['manual', 'automatic']);

const LISTING_SORTS = Object.freeze({
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  year_desc: { year: -1 },
  year_asc: { year: 1 },
  mileage_asc: { mileage: 1 },
});

module.exports = {
  ROLES,
  LISTING_STATUS,
  INQUIRY_STATUS,
  FUEL_TYPES,
  TRANSMISSIONS,
  LISTING_SORTS,
};
