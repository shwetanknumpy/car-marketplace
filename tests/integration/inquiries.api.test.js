'use strict';

const request = require('supertest');
const { buildApp, signIn } = require('../helpers/agent');
const { createSeller, createBuyer, createListing } = require('../helpers/factories');
const { LISTING_STATUS } = require('../../src/utils/constants');

describe('Inquiries API', () => {
  const app = buildApp();
  const message = 'Hi, is this still available? I could view it this weekend.';

  let seller;
  let buyer;
  let listing;

  beforeEach(async () => {
    seller = await createSeller();
    buyer = await createBuyer();
    listing = await createListing(seller);
  });

  describe('POST /api/v1/inquiries', () => {
    it('rejects an anonymous caller', async () => {
      await request(app)
        .post('/api/v1/inquiries')
        .send({ listingId: String(listing._id), message })
        .expect(401);
    });

    it('lets a signed-in buyer raise an inquiry', async () => {
      const agent = await signIn(app, buyer);

      const response = await agent
        .post('/api/v1/inquiries')
        .send({ listingId: String(listing._id), message });

      expect(response.status).toBe(201);
      expect(String(response.body.data.buyer.id)).toBe(String(buyer._id));
      expect(response.body.data.status).toBe('unread');
    });

    it('takes the buyer identity from the session, not the body', async () => {
      const impostor = await createBuyer();
      const agent = await signIn(app, buyer);

      const response = await agent.post('/api/v1/inquiries').send({
        listingId: String(listing._id),
        message,
        buyer: { id: impostor._id, name: 'Not me', email: impostor.email },
      });

      expect(response.status).toBe(201);
      expect(String(response.body.data.buyer.id)).toBe(String(buyer._id));
    });

    it('blocks a duplicate inquiry on the same listing', async () => {
      const agent = await signIn(app, buyer);
      const payload = { listingId: String(listing._id), message };

      await agent.post('/api/v1/inquiries').send(payload).expect(201);
      await agent.post('/api/v1/inquiries').send(payload).expect(409);
    });

    it('blocks a seller inquiring on their own listing', async () => {
      const agent = await signIn(app, seller);

      await agent
        .post('/api/v1/inquiries')
        .send({ listingId: String(listing._id), message })
        .expect(400);
    });

    it('blocks an inquiry on a draft listing', async () => {
      const draft = await createListing(seller, { status: LISTING_STATUS.DRAFT });
      const agent = await signIn(app, buyer);

      await agent
        .post('/api/v1/inquiries')
        .send({ listingId: String(draft._id), message })
        .expect(400);
    });

    it('rejects a message that is too short', async () => {
      const agent = await signIn(app, buyer);

      const response = await agent
        .post('/api/v1/inquiries')
        .send({ listingId: String(listing._id), message: 'hi' });

      expect(response.status).toBe(422);
    });
  });

  describe('inbox separation', () => {
    it('shows the seller what they received and the buyer what they sent', async () => {
      const buyerAgent = await signIn(app, buyer);
      await buyerAgent
        .post('/api/v1/inquiries')
        .send({ listingId: String(listing._id), message })
        .expect(201);

      const sellerAgent = await signIn(app, seller);
      const received = await sellerAgent.get('/api/v1/inquiries/received');
      const sent = await buyerAgent.get('/api/v1/inquiries/sent');

      expect(received.body.meta.total).toBe(1);
      expect(sent.body.meta.total).toBe(1);
      expect(String(received.body.data[0].sellerId)).toBe(String(seller._id));
    });

    it('closes the seller inbox to buyer sessions', async () => {
      const agent = await signIn(app, buyer);
      await agent.get('/api/v1/inquiries/received').expect(403);
    });

    it('never leaks another seller’s inquiries', async () => {
      const otherSeller = await createSeller();
      const buyerAgent = await signIn(app, buyer);
      await buyerAgent
        .post('/api/v1/inquiries')
        .send({ listingId: String(listing._id), message })
        .expect(201);

      const agent = await signIn(app, otherSeller);
      const response = await agent.get('/api/v1/inquiries/received');

      expect(response.body.meta.total).toBe(0);
    });

    it('paginates the seller inbox', async () => {
      const buyers = await Promise.all([createBuyer(), createBuyer(), createBuyer()]);
      for (const b of buyers) {
        const agent = await signIn(app, b);
        await agent
          .post('/api/v1/inquiries')
          .send({ listingId: String(listing._id), message })
          .expect(201);
      }

      const sellerAgent = await signIn(app, seller);
      const response = await sellerAgent.get('/api/v1/inquiries/received?page=1&limit=2');

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toMatchObject({ total: 3, totalPages: 2 });
    });
  });

  describe('replying and reading', () => {
    let inquiryId;

    beforeEach(async () => {
      const buyerAgent = await signIn(app, buyer);
      const response = await buyerAgent
        .post('/api/v1/inquiries')
        .send({ listingId: String(listing._id), message });
      inquiryId = response.body.data._id;
    });

    it('lets the recipient seller reply', async () => {
      const agent = await signIn(app, seller);

      const response = await agent
        .post(`/api/v1/inquiries/${inquiryId}/reply`)
        .send({ message: 'Yes, still available. Saturday works.' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('replied');
    });

    it('stops a buyer from replying on the seller’s behalf', async () => {
      const agent = await signIn(app, buyer);

      await agent
        .post(`/api/v1/inquiries/${inquiryId}/reply`)
        .send({ message: 'Replying to myself' })
        .expect(403);
    });

    it('stops an unrelated seller from replying', async () => {
      const otherSeller = await createSeller();
      const agent = await signIn(app, otherSeller);

      await agent
        .post(`/api/v1/inquiries/${inquiryId}/reply`)
        .send({ message: 'Not my inquiry' })
        .expect(403);
    });

    it('marks an inquiry as read for the recipient', async () => {
      const agent = await signIn(app, seller);

      const response = await agent.patch(`/api/v1/inquiries/${inquiryId}/read`);
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('read');
    });

    it('refuses to show the inquiry to a third party', async () => {
      const stranger = await createBuyer();
      const agent = await signIn(app, stranger);

      await agent.get(`/api/v1/inquiries/${inquiryId}`).expect(403);
    });
  });
});
