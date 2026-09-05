'use strict';

const authService = require('../../src/services/authService');
const { User } = require('../../src/models');
const { ROLES } = require('../../src/utils/constants');
const { createUser } = require('../helpers/factories');

describe('authService', () => {
  describe('register', () => {
    it('stores a bcrypt hash rather than the password', async () => {
      const user = await authService.register({
        name: 'Dana Okonkwo',
        email: 'Dana@Example.com',
        password: 'Password123',
        role: ROLES.SELLER,
      });

      const stored = await User.findById(user._id).select('+passwordHash');

      expect(stored.passwordHash).not.toBe('Password123');
      expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(await stored.verifyPassword('Password123')).toBe(true);
    });

    it('normalizes the email to lowercase', async () => {
      const user = await authService.register({
        name: 'Dana',
        email: 'MiXeD@Example.com',
        password: 'Password123',
      });
      expect(user.email).toBe('mixed@example.com');
    });

    it('rejects a duplicate email', async () => {
      await createUser({ email: 'taken@example.com' });

      await expect(
        authService.register({
          name: 'Someone Else',
          email: 'taken@example.com',
          password: 'Password123',
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('never grants admin from the signup payload', async () => {
      const user = await authService.register({
        name: 'Sneaky',
        email: 'sneaky@example.com',
        password: 'Password123',
        role: 'admin',
      });

      expect(user.role).toBe(ROLES.BUYER);
    });
  });

  describe('authenticate', () => {
    it('returns the user for correct credentials', async () => {
      const created = await createUser({ email: 'good@example.com' });

      const user = await authService.authenticate({
        email: 'good@example.com',
        password: 'Password123',
      });

      expect(String(user._id)).toBe(String(created._id));
    });

    it('rejects a wrong password', async () => {
      await createUser({ email: 'user@example.com' });

      await expect(
        authService.authenticate({
          email: 'user@example.com',
          password: 'WrongPassword1',
        })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('gives the same error for an unknown account, so emails cannot be enumerated', async () => {
      await createUser({ email: 'real@example.com' });

      const unknown = await authService
        .authenticate({ email: 'nobody@example.com', password: 'Password123' })
        .catch((error) => error);
      const wrongPassword = await authService
        .authenticate({ email: 'real@example.com', password: 'Nope12345' })
        .catch((error) => error);

      expect(unknown.statusCode).toBe(401);
      expect(unknown.message).toBe(wrongPassword.message);
    });
  });

  describe('changePassword', () => {
    it('replaces the hash when the current password matches', async () => {
      const user = await createUser({ email: 'change@example.com' });

      await authService.changePassword(user._id, {
        currentPassword: 'Password123',
        newPassword: 'BrandNew456',
      });

      const reloaded = await User.findById(user._id).select('+passwordHash');
      expect(await reloaded.verifyPassword('BrandNew456')).toBe(true);
      expect(await reloaded.verifyPassword('Password123')).toBe(false);
    });

    it('refuses when the current password is wrong', async () => {
      const user = await createUser();

      await expect(
        authService.changePassword(user._id, {
          currentPassword: 'NotMyPassword1',
          newPassword: 'BrandNew456',
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  it('puts only id, name, email and role into the session', async () => {
    const user = await createUser();
    expect(Object.keys(authService.toSessionUser(user)).sort()).toEqual([
      'email',
      'id',
      'name',
      'role',
    ]);
  });
});
