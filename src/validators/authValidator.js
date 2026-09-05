'use strict';

const { z } = require('zod');
const { ROLES } = require('../utils/constants');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), {
    message: 'Password must contain at least one letter and one number',
  });

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: passwordSchema,
  // Only these two are self-selectable; admin is never granted at signup.
  role: z.enum([ROLES.BUYER, ROLES.SELLER]).default(ROLES.BUYER),
  phone: z.string().trim().max(30).optional().default(''),
  location: z.string().trim().max(120).optional().default(''),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

module.exports = { registerSchema, loginSchema, changePasswordSchema };
