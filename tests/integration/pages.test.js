'use strict';

const request = require('supertest');
const { buildApp, signIn } = require('../helpers/agent');
const { createSeller, createBuyer, createListing } = require('../helpers/factories');

/**
 * The rendered pages are gated by the same role rules as the API, so a buyer
 * cannot reach a seller screen by typing its URL.
 */
describe('Web pages', () => {
  const app = buildApp();

  it('renders the home page anonymously', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('AutoMarket');
  });

  it('renders the browse page with results', async () => {
    const seller = await createSeller();
    await createListing(seller, { title: '2019 Toyota Corolla LE' });

    const response = await request(app).get('/cars');
    expect(response.status).toBe(200);
    expect(response.text).toContain('2019 Toyota Corolla LE');
  });

  it('renders a listing detail page', async () => {
    const seller = await createSeller();
    const listing = await createListing(seller);

    const response = await request(app).get(`/cars/${listing._id}`);
    expect(response.status).toBe(200);
    expect(response.text).toContain(listing.title);
  });

  it('redirects an anonymous visitor from the dashboard to the login form', async () => {
    const response = await request(app).get('/dashboard');
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/login');
  });

  it('refuses the dashboard to a buyer session', async () => {
    const buyer = await createBuyer();
    const agent = await signIn(app, buyer);

    const response = await agent.get('/dashboard');
    expect(response.status).toBe(403);
  });

  it('refuses the new-listing form to a buyer session', async () => {
    const buyer = await createBuyer();
    const agent = await signIn(app, buyer);

    const response = await agent.get('/cars/new');
    expect(response.status).toBe(403);
  });

  it('serves the dashboard to a seller session', async () => {
    const seller = await createSeller();
    const agent = await signIn(app, seller);

    const response = await agent.get('/dashboard');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Seller dashboard');
  });

  it("refuses the edit form for another seller's listing", async () => {
    const owner = await createSeller();
    const intruder = await createSeller();
    const listing = await createListing(owner);
    const agent = await signIn(app, intruder);

    const response = await agent.get(`/cars/${listing._id}/edit`);
    expect(response.status).toBe(403);
  });

  it('renders a 404 page for an unknown route', async () => {
    const response = await request(app).get('/no-such-page');
    expect(response.status).toBe(404);
  });
});
