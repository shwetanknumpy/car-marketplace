'use strict';

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    data: {
      status: 'ok',
      database: states[mongoose.connection.readyState] || 'unknown',
      uptimeSeconds: Math.round(process.uptime()),
    },
  });
});

router.use('/auth', require('./auth.routes'));
router.use('/listings', require('./listing.routes'));
router.use('/inquiries', require('./inquiry.routes'));
router.use('/users', require('./user.routes'));

module.exports = router;
