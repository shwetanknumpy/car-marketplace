'use strict';

const { User, Listing } = require('../../src/models');
const { ROLES, LISTING_STATUS } = require('../../src/utils/constants');

const DEFAULT_PASSWORD = 'Password123';

let counter = 0;
const uniqueEmail = (prefix) => `${prefix}-${Date.now()}-${counter++}@example.com`;

async function createUser(overrides = {}) {
  const passwordHash = await User.hashPassword(
    overrides.password || DEFAULT_PASSWORD
  );

  return User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || uniqueEmail('user'),
    passwordHash,
    role: overrides.role || ROLES.BUYER,
    phone: overrides.phone || '555-0100',
    location: overrides.location || 'Austin, TX',
  });
}

const createSeller = (overrides = {}) =>
  createUser({ name: 'Test Seller', role: ROLES.SELLER, ...overrides });

const createBuyer = (overrides = {}) =>
  createUser({ name: 'Test Buyer', role: ROLES.BUYER, ...overrides });

async function createListing(seller, overrides = {}) {
  return Listing.create({
    title: overrides.title || '2019 Toyota Corolla LE',
    make: overrides.make || 'Toyota',
    model: overrides.model || 'Corolla',
    year: overrides.year ?? 2019,
    price: overrides.price ?? 14800,
    mileage: overrides.mileage ?? 41200,
    fuelType: overrides.fuelType || 'petrol',
    transmission: overrides.transmission || 'automatic',
    location: overrides.location || 'Austin, TX',
    description:
      overrides.description ||
      'Well maintained with full service history and a recent inspection.',
    images: overrides.images || [],
    status: overrides.status || LISTING_STATUS.ACTIVE,
    seller: seller.toContactSnapshot(),
    ...(overrides.inquiryCount !== undefined
      ? { inquiryCount: overrides.inquiryCount }
      : {}),
  });
}

module.exports = {
  DEFAULT_PASSWORD,
  createUser,
  createSeller,
  createBuyer,
  createListing,
  uniqueEmail,
};
