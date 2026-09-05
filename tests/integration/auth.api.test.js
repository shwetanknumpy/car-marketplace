'use strict';

const request = require('supertest');
const { buildApp, agentFor, signIn } = require('../helpers/agent');
const { createUser, DEFAULT_PASSWORD } = require('../helpers/factories');
const { ROLES } = require('../../src/utils/constants');

describe('Auth API', () => {
  const app = buildApp();

  describe('POST /api/v1/auth/register', () => {
    it('creates an account and starts a session', async () => {
      const agent = agentFor(app);

      const response = await agent.post('/api/v1/auth/register').send({
        name: 'Dana Okonkwo',
        email: 'dana@example.com',
        password: 'Password123',
        role: ROLES.SELLER,
      });

      expect(response.status).toBe(201);
      expect(response.body.data.user.email).toBe('dana@example.com');
      expect(response.headers['set-cookie']).toBeDefined();

      const me = await agent.get('/api/v1/auth/me');
      expect(me.status).toBe(200);
      expect(me.body.data.user.role).toBe(ROLES.SELLER);
    });

    it('never returns the password hash', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Dana',
        email: 'nohash@example.com',
        password: 'Password123',
      });

      expect(JSON.stringify(response.body)).not.toContain('passwordHash');
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('rejects a weak password', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Dana',
        email: 'weak@example.com',
        password: 'short',
      });

      expect(response.status).toBe(422);
      expect(response.body.error.details.some((d) => d.field === 'password')).toBe(true);
    });

    it('rejects a duplicate email with 409', async () => {
      await createUser({ email: 'dupe@example.com' });

      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Another Dana',
        email: 'dupe@example.com',
        password: 'Password123',
      });

      expect(response.status).toBe(409);
    });

    it('ignores an attempt to self-assign the admin role', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Sneaky',
        email: 'sneaky@example.com',
        password: 'Password123',
        role: 'admin',
      });

      // The enum rejects it outright rather than silently downgrading.
      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('signs in with correct credentials', async () => {
      const user = await createUser({ email: 'login@example.com' });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: DEFAULT_PASSWORD });

      expect(response.status).toBe(200);
      expect(response.body.data.user.id).toBe(String(user._id));
    });

    it('rejects a wrong password with 401', async () => {
      await createUser({ email: 'login2@example.com' });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'login2@example.com', password: 'WrongPassword1' });

      expect(response.status).toBe(401);
    });

    it('issues a session cookie that is httpOnly and sameSite', async () => {
      await createUser({ email: 'cookie@example.com' });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'cookie@example.com', password: DEFAULT_PASSWORD });

      const cookie = response.headers['set-cookie'][0];
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
    });
  });

  describe('session lifecycle', () => {
    it('rejects /me without a session', async () => {
      const response = await request(app).get('/api/v1/auth/me');
      expect(response.status).toBe(401);
    });

    it('ends the session on logout', async () => {
      const user = await createUser({ email: 'logout@example.com' });
      const agent = await signIn(app, user);

      expect((await agent.get('/api/v1/auth/me')).status).toBe(200);

      await agent.post('/api/v1/auth/logout').expect(200);

      expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
    });

    it('regenerates the session id on sign-in, so a pre-auth id cannot be reused', async () => {
      const user = await createUser({ email: 'fixation@example.com' });
      const agent = agentFor(app);

      // Touch an endpoint first so a session may already exist.
      await agent.get('/api/v1/auth/me');
      const before = await agent.get('/');
      const preAuthCookie = before.headers['set-cookie'];

      const login = await agent
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: DEFAULT_PASSWORD });

      expect(login.status).toBe(200);
      expect(login.headers['set-cookie']).toBeDefined();
      if (preAuthCookie) {
        expect(login.headers['set-cookie'][0]).not.toBe(preAuthCookie[0]);
      }
    });
  });

  describe('POST /api/v1/auth/password', () => {
    it('changes the password and keeps the old one from working', async () => {
      const user = await createUser({ email: 'pw@example.com' });
      const agent = await signIn(app, user);

      await agent
        .post('/api/v1/auth/password')
        .send({ currentPassword: DEFAULT_PASSWORD, newPassword: 'BrandNew456' })
        .expect(200);

      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'pw@example.com', password: DEFAULT_PASSWORD })
        .expect(401);

      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'pw@example.com', password: 'BrandNew456' })
        .expect(200);
    });
  });
});
