'use strict';

/**
 * Development seed: wipes the collections, builds indexes, and inserts a small
 * but realistic dataset so the search filters have something to work against.
 *
 * Usage: npm run seed
 */

const { connect, disconnect, syncIndexes } = require('../config/database');
const { User, Listing, Inquiry } = require('../models');
const { ROLES, LISTING_STATUS } = require('../utils/constants');

const PASSWORD = 'Password123';

const SELLERS = [
  { name: 'Dana Okonkwo', email: 'dana@example.com', location: 'Austin, TX', phone: '555-0142' },
  { name: 'Marcus Reyes', email: 'marcus@example.com', location: 'Denver, CO', phone: '555-0187' },
];

const BUYERS = [
  { name: 'Priya Raman', email: 'priya@example.com', location: 'Seattle, WA', phone: '555-0110' },
  { name: 'Sam Whitfield', email: 'sam@example.com', location: 'Chicago, IL', phone: '555-0166' },
];

const CARS = [
  ['Toyota', 'Corolla', 2019, 14800, 41200, 'petrol', 'automatic'],
  ['Toyota', 'RAV4', 2021, 26400, 22100, 'hybrid', 'automatic'],
  ['Honda', 'Civic', 2018, 13250, 58900, 'petrol', 'manual'],
  ['Honda', 'CR-V', 2020, 23900, 33400, 'petrol', 'automatic'],
  ['Volkswagen', 'Golf', 2017, 11400, 71200, 'diesel', 'manual'],
  ['Volkswagen', 'Passat', 2019, 16750, 49800, 'diesel', 'automatic'],
  ['Ford', 'Focus', 2016, 8200, 88300, 'petrol', 'manual'],
  ['Ford', 'Mustang', 2020, 34500, 18700, 'petrol', 'automatic'],
  ['Tesla', 'Model 3', 2021, 33900, 26400, 'electric', 'automatic'],
  ['Tesla', 'Model Y', 2022, 41200, 14900, 'electric', 'automatic'],
  ['BMW', '3 Series', 2018, 19800, 52100, 'diesel', 'automatic'],
  ['BMW', 'X5', 2019, 36400, 44700, 'diesel', 'automatic'],
  ['Hyundai', 'Tucson', 2020, 19100, 31600, 'petrol', 'automatic'],
  ['Hyundai', 'i30', 2018, 10900, 63200, 'petrol', 'manual'],
  ['Mazda', 'CX-5', 2019, 20400, 38900, 'petrol', 'automatic'],
  ['Mazda', 'MX-5', 2017, 17600, 29800, 'petrol', 'manual'],
];

async function seed() {
  await connect();
  console.log('[seed] connected');

  await Promise.all([
    User.deleteMany({}),
    Listing.deleteMany({}),
    Inquiry.deleteMany({}),
  ]);
  console.log('[seed] collections cleared');

  const passwordHash = await User.hashPassword(PASSWORD);

  const sellers = await User.create(
    SELLERS.map((seller) => ({ ...seller, passwordHash, role: ROLES.SELLER }))
  );
  const buyers = await User.create(
    BUYERS.map((buyer) => ({ ...buyer, passwordHash, role: ROLES.BUYER }))
  );
  console.log(`[seed] ${sellers.length} sellers, ${buyers.length} buyers`);

  const listings = await Listing.create(
    CARS.map(([make, model, year, price, mileage, fuelType, transmission], index) => {
      const seller = sellers[index % sellers.length];
      return {
        title: `${year} ${make} ${model}`,
        make,
        model,
        year,
        price,
        mileage,
        fuelType,
        transmission,
        location: seller.location,
        description:
          `Well-maintained ${year} ${make} ${model} with full service history. ` +
          'Recent inspection, new tyres, and no outstanding finance. ' +
          'Happy to arrange a viewing or an independent inspection.',
        images: [],
        // Leave the last two as drafts so the dashboard has both states.
        status: index < CARS.length - 2 ? LISTING_STATUS.ACTIVE : LISTING_STATUS.DRAFT,
        seller: seller.toContactSnapshot(),
      };
    })
  );
  console.log(`[seed] ${listings.length} listings`);

  const activeListings = listings.filter((l) => l.status === LISTING_STATUS.ACTIVE);
  const inquiries = await Inquiry.create(
    activeListings.slice(0, 4).map((listing, index) => {
      const buyer = buyers[index % buyers.length];
      return {
        listing: {
          id: listing._id,
          title: listing.title,
          price: listing.price,
          image: null,
        },
        buyer: buyer.toContactSnapshot(),
        sellerId: listing.seller.id,
        message:
          `Hi, is the ${listing.title} still available? ` +
          'I am in the area this weekend and could come and take a look.',
      };
    })
  );

  await Promise.all(
    inquiries.map((inquiry) =>
      Listing.updateOne({ _id: inquiry.listing.id }, { $inc: { inquiryCount: 1 } })
    )
  );
  console.log(`[seed] ${inquiries.length} inquiries`);

  await syncIndexes();
  console.log('[seed] indexes synced');

  console.log('\nSign in with any of these (password: %s)', PASSWORD);
  SELLERS.forEach((s) => console.log(`  seller  ${s.email}`));
  BUYERS.forEach((b) => console.log(`  buyer   ${b.email}`));

  await disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[seed] failed', error);
    process.exit(1);
  });
