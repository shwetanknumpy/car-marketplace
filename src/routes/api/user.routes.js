'use strict';

const express = require('express');
const userController = require('../../controllers/userController');
const validate = require('../../middleware/validate');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { idParam } = require('../../validators/common');
const {
  updateProfileSchema,
  userQuerySchema,
} = require('../../validators/userValidator');

const router = express.Router();

router.get('/me', requireAuth, userController.getMe);

router.patch(
  '/me',
  requireAuth,
  validate({ body: updateProfileSchema }),
  userController.updateMe
);

router.post('/me/become-seller', requireAuth, userController.becomeSeller);

router.delete('/me', requireAuth, userController.deleteMe);

// Admin directory. Declared after `/me` so the literal path wins.
router.get(
  '/',
  requireAuth,
  requireAdmin,
  validate({ query: userQuerySchema }),
  userController.list
);

router.get('/:id', validate({ params: idParam }), userController.getPublic);

module.exports = router;
