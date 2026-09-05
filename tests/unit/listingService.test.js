'use strict';

const listingService = require('../../src/services/listingService');
const { Listing } = require('../../src/models');
const { LISTING_STATUS, ROLES } = require('../../src/utils/constants');
const { createSeller, createBuyer, createListing } = require('../helpers/factories');

describe('listingService', () => {
  describe('searchListings', () => {
    let seller;

    beforeEach(async () => {
      seller = await createSeller();
      await Promise.all([
        createListing(seller, { make: 'Toyota', model: 'Corolla', year: 2019, price: 14800 }),
        createListing(seller, { make: 'Toyota', model: 'RAV4', year: 2021, price: 26400 }),
        createListing(seller, { make: 'Honda', model: 'Civic', year: 2018, price: 13250 }),
        createListing(seller, { make: 'Honda', model: 'CR-V', year: 2020, price: 23900 }),
        createListing(seller, {
          make: 'Ford',
          model: 'Focus',
          year: 2016,
          price: 8200,
          status: LISTING_STATUS.DRAFT,
        }),
      ]);
    });

    it('returns only active listings', async () => {
      const { items, meta } = await listingService.searchListings({});
      expect(meta.total).toBe(4);
      expect(items.every((item) => item.status === LISTING_STATUS.ACTIVE)).toBe(true);
    });

    it('filters by make', async () => {
      const { items, meta } = await listingService.searchListings({ make: 'Toyota' });
      expect(meta.total).toBe(2);
      expect(items.every((item) => item.make === 'Toyota')).toBe(true);
    });

    it('filters by make and model together', async () => {
      const { items } = await listingService.searchListings({
        make: 'Honda',
        model: 'Civic',
      });
      expect(items).toHaveLength(1);
      expect(items[0].model).toBe('Civic');
    });

    it('filters by a price range', async () => {
      const { items } = await listingService.searchListings({
        minPrice: 14000,
        maxPrice: 25000,
      });
      expect(items.map((i) => i.price).sort((a, b) => a - b)).toEqual([14800, 23900]);
    });

    it('filters by a year range', async () => {
      const { items } = await listingService.searchListings({ minYear: 2020 });
      expect(items.every((item) => item.year >= 2020)).toBe(true);
      expect(items).toHaveLength(2);
    });

    it('combines several parameters at once', async () => {
      const { items } = await listingService.searchListings({
        make: 'Toyota',
        minYear: 2020,
        maxPrice: 30000,
      });
      expect(items).toHaveLength(1);
      expect(items[0].model).toBe('RAV4');
    });

    it('sorts by price ascending on request', async () => {
      const { items } = await listingService.searchListings({ sort: 'price_asc' });
      const prices = items.map((item) => item.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('paginates, keeping the page size fixed', async () => {
      const first = await listingService.searchListings({ page: 1, limit: 2 });
      const second = await listingService.searchListings({ page: 2, limit: 2 });

      expect(first.items).toHaveLength(2);
      expect(second.items).toHaveLength(2);
      expect(first.meta).toMatchObject({ total: 4, totalPages: 2, hasNextPage: true });
      expect(second.meta).toMatchObject({ hasNextPage: false, hasPrevPage: true });

      const firstIds = first.items.map((i) => String(i._id));
      const secondIds = second.items.map((i) => String(i._id));
      expect(firstIds.filter((id) => secondIds.includes(id))).toHaveLength(0);
    });

    it('omits the description from search results so payload size stays flat', async () => {
      const { items } = await listingService.searchListings({ limit: 1 });
      expect(items[0].description).toBeUndefined();
      expect(items[0].title).toBeDefined();
      expect(items[0].price).toBeDefined();
    });

    it('ignores a sellerId supplied by the caller', async () => {
      const other = await createSeller();
      const { meta } = await listingService.searchListings({ sellerId: other._id });
      expect(meta.total).toBe(4);
    });
  });

  describe('getListingById', () => {
    it('hides a draft from everyone but its seller', async () => {
      const seller = await createSeller();
      const buyer = await createBuyer();
      const draft = await createListing(seller, { status: LISTING_STATUS.DRAFT });

      await expect(
        listingService.getListingById(draft._id, {
          viewer: { id: buyer._id, role: ROLES.BUYER },
        })
      ).rejects.toMatchObject({ statusCode: 404 });

      const seen = await listingService.getListingById(draft._id, {
        viewer: { id: seller._id, role: ROLES.SELLER },
      });
      expect(String(seen._id)).toBe(String(draft._id));
    });
  });

  describe('createListing', () => {
    it('denormalizes the seller snapshot onto the listing', async () => {
      const seller = await createSeller({ name: 'Dana Okonkwo' });

      const listing = await listingService.createListing(seller._id, {
        title: '2020 Mazda CX-5 Sport',
        make: 'Mazda',
        model: 'CX-5',
        year: 2020,
        price: 20400,
        mileage: 38900,
        description: 'Full service history and a recent major service.',
        status: LISTING_STATUS.ACTIVE,
      });

      expect(listing.seller.name).toBe('Dana Okonkwo');
      expect(listing.seller.email).toBe(seller.email);
      expect(String(listing.seller.id)).toBe(String(seller._id));
    });

    it('refuses to publish for a buyer account', async () => {
      const buyer = await createBuyer();

      await expect(
        listingService.createListing(buyer._id, {
          title: 'Not allowed',
          make: 'Ford',
          model: 'Focus',
          year: 2016,
          price: 8200,
          mileage: 88300,
          description: 'A buyer should never get this far.',
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('ownership', () => {
    it('lets a seller update their own listing', async () => {
      const seller = await createSeller();
      const listing = await createListing(seller);

      const updated = await listingService.updateListing(
        listing._id,
        { id: seller._id, role: ROLES.SELLER },
        { price: 12500 }
      );

      expect(updated.price).toBe(12500);
    });

    it("refuses to update another seller's listing", async () => {
      const owner = await createSeller();
      const intruder = await createSeller();
      const listing = await createListing(owner);

      await expect(
        listingService.updateListing(
          listing._id,
          { id: intruder._id, role: ROLES.SELLER },
          { price: 1 }
        )
      ).rejects.toMatchObject({ statusCode: 403 });

      const untouched = await Listing.findById(listing._id);
      expect(untouched.price).toBe(listing.price);
    });

    it("refuses to delete another seller's listing", async () => {
      const owner = await createSeller();
      const intruder = await createSeller();
      const listing = await createListing(owner);

      await expect(
        listingService.deleteListing(listing._id, {
          id: intruder._id,
          role: ROLES.SELLER,
        })
      ).rejects.toMatchObject({ statusCode: 403 });

      expect(await Listing.findById(listing._id)).not.toBeNull();
    });

    it('ignores fields that are not editable', async () => {
      const seller = await createSeller();
      const listing = await createListing(seller);

      const updated = await listingService.updateListing(
        listing._id,
        { id: seller._id, role: ROLES.SELLER },
        { price: 9999, inquiryCount: 500, seller: { name: 'Hacked' } }
      );

      expect(updated.price).toBe(9999);
      expect(updated.inquiryCount).toBe(0);
      expect(updated.seller.name).toBe(seller.name);
    });
  });

  describe('getSellerStats', () => {
    it('counts listings by status for one seller only', async () => {
      const seller = await createSeller();
      const other = await createSeller();

      await createListing(seller, { status: LISTING_STATUS.ACTIVE });
      await createListing(seller, { status: LISTING_STATUS.SOLD });
      await createListing(seller, { status: LISTING_STATUS.DRAFT });
      await createListing(other, { status: LISTING_STATUS.ACTIVE });

      const stats = await listingService.getSellerStats(seller._id);
      expect(stats).toMatchObject({ total: 3, active: 1, sold: 1, drafts: 1 });
    });
  });
});
