const express = require('express');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const [[dbStatus]] = await pool.query('SELECT 1 AS ok');
  ok(res, {
    service: 'order-system-api',
    database: dbStatus.ok === 1 ? 'connected' : 'unknown',
  });
}));

module.exports = router;
