'use strict';

const express = require('express');
const authController = require('../../controllers/authController');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimit');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} = require('../../validators/authValidator');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  authController.login
);

router.post('/logout', authController.logout);

router.get('/me', requireAuth, authController.me);

router.post(
  '/password',
  requireAuth,
  authLimiter,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

module.exports = router;
