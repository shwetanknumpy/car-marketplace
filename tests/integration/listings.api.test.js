'use strict';

const request = require('supertest');
const { buildApp, signIn } = require('../helpers/agent');
const { createSeller, createBuyer, createListing } = require('../helpers/factories');
const { Listing } = require('../../src/models');
const { LISTING_STATUS } = require('../../src/utils/constants');

describe('Listings API', () => {
  const app = buildApp();

  const validPayload = {
    title: '2020 Mazda CX-5 Sport',
    make: 'Mazda',
    model: 'CX-5',
    year: 2020,
    price: 20400,
    mileage: 38900,
    fuelType: 'petrol',
    transmission: 'automatic',
    location: 'Austin, TX',
    description: 'Full service history, recent major service, no outstanding finance.',
    status: LISTING_STATUS.ACTIVE,
  };

  describe('GET /api/v1/listings (public search)', () => {
    let seller;

    beforeEach(async () => {
      seller = await createSeller();
      await Promise.all([
        createListing(seller, { make: 'Toyota', model: 'Corolla', year: 2019, price: 14800, mileage: 41200 }),
        createListing(seller, { make: 'Toyota', model: 'RAV4', year: 2021, price: 26400, mileage: 22100 }),
        createListing(seller, { make: 'Honda', model: 'Civic', year: 2018, price: 13250, mileage: 58900 }),
        createListing(seller, { make: 'Tesla', model: 'Model 3', year: 2021, price: 33900, mileage: 26400, fuelType: 'electric' }),
        createListing(seller, { make: 'Ford', model: 'Focus', status: LISTING_STATUS.DRAFT }),
      ]);
    });

    it('is reachable without a session', async () => {
      const response = await request(app).get('/api/v1/listings');
      expect(response.status).toBe(200);
      expect(response.body.meta.total).toBe(4);
    });

    it('excludes drafts from public results', async () => {
      const response = await request(app).get('/api/v1/listings?make=Ford');
      expect(response.body.meta.total).toBe(0);
    });

    it('filters by make, model, year and price together', async () => {
      const response = await request(app)
        .get('/api/v1/listings')
        .query({ make: 'Toyota', minYear: 2020, maxPrice: 30000 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].model).toBe('RAV4');
    });

    it('filters by fuel type', async () => {
      const response = await request(app).get('/api/v1/listings?fuelType=electric');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].make).toBe('Tesla');
    });

    it('returns pagination meta and honours page/limit', async () => {
      const response = await request(app).get('/api/v1/listings?page=2&limit=2');

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toMatchObject({
        page: 2,
        limit: 2,
        total: 4,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    it('caps limit so a caller cannot demand the whole collection', async () => {
      const response = await request(app).get('/api/v1/listings?limit=100000');
      expect(response.status).toBe(200);
      expect(response.body.meta.limit).toBeLessThanOrEqual(50);
    });

    it('rejects an out-of-range filter value', async () => {
      const response = await request(app).get('/api/v1/listings?minYear=1200');
      expect(response.status).toBe(422);
    });

    it('supports keyword search across title and description', async () => {
      const response = await request(app).get('/api/v1/listings?q=Corolla');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].make).toBe('Toyota');
    });

    it('returns summary fields only', async () => {
      const response = await request(app).get('/api/v1/listings?limit=1');
      const [item] = response.body.data;

      expect(item.title).toBeDefined();
      expect(item.price).toBeDefined();
      expect(item.seller.name).toBeDefined();
      expect(item.description).toBeUndefined();
      expect(item.seller.email).toBeUndefined();
    });
  });

  describe('POST /api/v1/listings (seller only)', () => {
    it('rejects an anonymous caller with 401', async () => {
      const response = await request(app).post('/api/v1/listings').send(validPayload);
      expect(response.status).toBe(401);
      expect(await Listing.countDocuments()).toBe(0);
    });

    it('rejects a buyer session with 403', async () => {
      const buyer = await createBuyer();
      const agent = await signIn(app, buyer);

      const response = await agent.post('/api/v1/listings').send(validPayload);

      expect(response.status).toBe(403);
      expect(await Listing.countDocuments()).toBe(0);
    });

    it('creates a listing for a seller session', async () => {
      const seller = await createSeller();
      const agent = await signIn(app, seller);

      const response = await agent.post('/api/v1/listings').send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body.data.make).toBe('Mazda');
      expect(String(response.body.data.seller.id)).toBe(String(seller._id));
    });

    it('takes the seller from the session, not the request body', async () => {
      const seller = await createSeller();
      const impersonated = await createSeller();
      const agent = await signIn(app, seller);

      const response = await agent.post('/api/v1/listings').send({
        ...validPayload,
        seller: { id: impersonated._id, name: 'Someone Else', email: impersonated.email },
      });

      expect(response.status).toBe(201);
      expect(String(response.body.data.seller.id)).toBe(String(seller._id));
      expect(response.body.data.seller.name).toBe(seller.name);
    });

    it('rejects an invalid payload with field-level detail', async () => {
      const seller = await createSeller();
      const agent = await signIn(app, seller);

      const response = await agent
        .post('/api/v1/listings')
        .send({ ...validPayload, year: 1200, price: -5, description: 'too short' });

      expect(response.status).toBe(422);
      const fields = response.body.error.details.map((d) => d.field);
      expect(fields).toEqual(expect.arrayContaining(['year', 'price', 'description']));
    });
  });

  describe('PATCH / DELETE /api/v1/listings/:id', () => {
    it("refuses to update another seller's listing", async () => {
      const owner = await createSeller();
      const intruder = await createSeller();
      const listing = await createListing(owner);
      const agent = await signIn(app, intruder);

      const response = await agent
        .patch(`/api/v1/listings/${listing._id}`)
        .send({ price: 1 });

      expect(response.status).toBe(403);
      expect((await Listing.findById(listing._id)).price).toBe(listing.price);
    });

    it('updates the owner’s own listing', async () => {
      const owner = await createSeller();
      const listing = await createListing(owner);
      const agent = await signIn(app, owner);

      const response = await agent
        .patch(`/api/v1/listings/${listing._id}`)
        .send({ price: 12500, status: LISTING_STATUS.SOLD });

      expect(response.status).toBe(200);
      expect(response.body.data.price).toBe(12500);
      expect(response.body.data.status).toBe(LISTING_STATUS.SOLD);
    });

    it("refuses to delete another seller's listing", async () => {
      const owner = await createSeller();
      const intruder = await createSeller();
      const listing = await createListing(owner);
      const agent = await signIn(app, intruder);

      await agent.delete(`/api/v1/listings/${listing._id}`).expect(403);
      expect(await Listing.findById(listing._id)).not.toBeNull();
    });

    it('deletes the owner’s own listing', async () => {
      const owner = await createSeller();
      const listing = await createListing(owner);
      const agent = await signIn(app, owner);

      await agent.delete(`/api/v1/listings/${listing._id}`).expect(200);
      expect(await Listing.findById(listing._id)).toBeNull();
    });

    it('rejects a malformed id with 422 rather than a database error', async () => {
      const owner = await createSeller();
      const agent = await signIn(app, owner);

      const response = await agent.patch('/api/v1/listings/not-an-id').send({ price: 1 });
      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/v1/listings/mine', () => {
    it('returns the seller’s own listings including drafts', async () => {
      const seller = await createSeller();
      const other = await createSeller();
      await createListing(seller, { status: LISTING_STATUS.ACTIVE });
      await createListing(seller, { status: LISTING_STATUS.DRAFT });
      await createListing(other, { status: LISTING_STATUS.ACTIVE });

      const agent = await signIn(app, seller);
      const response = await agent.get('/api/v1/listings/mine');

      expect(response.status).toBe(200);
      expect(response.body.meta.total).toBe(2);
      expect(
        response.body.data.every((l) => String(l.seller.id) === String(seller._id))
      ).toBe(true);
    });

    it('is closed to buyer sessions', async () => {
      const buyer = await createBuyer();
      const agent = await signIn(app, buyer);
      await agent.get('/api/v1/listings/mine').expect(403);
    });
  });

  describe('GET /api/v1/listings/:id', () => {
    it('returns a 404 for a draft viewed by a stranger', async () => {
      const seller = await createSeller();
      const draft = await createListing(seller, { status: LISTING_STATUS.DRAFT });

      await request(app).get(`/api/v1/listings/${draft._id}`).expect(404);
    });

    it('returns the draft to its own seller', async () => {
      const seller = await createSeller();
      const draft = await createListing(seller, { status: LISTING_STATUS.DRAFT });
      const agent = await signIn(app, seller);

      await agent.get(`/api/v1/listings/${draft._id}`).expect(200);
    });
  });
});
