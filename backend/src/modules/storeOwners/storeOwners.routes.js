const express = require('express');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok, created } = require('../../utils/response');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const keyword = req.query.keyword ? `%${req.query.keyword}%` : null;
  const where = [];
  const params = [];

  if (keyword) {
    where.push('(so.login_id LIKE ? OR so.name LIKE ? OR so.phone LIKE ? OR s.store_name LIKE ?)');
    params.push(keyword, keyword, keyword, keyword);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT so.id, so.store_id AS storeId, s.store_name AS storeName,
            so.login_id AS loginId, so.name, so.phone, so.email,
            so.is_active AS isActive, so.created_at AS createdAt,
            COUNT(DISTINCT o.id) AS orderCount,
            COALESCE(SUM(o.total_amount), 0) AS orderAmount,
            COUNT(DISTINCT si.id) AS inquiryCount
       FROM store_owners so
       JOIN stores s ON s.id = so.store_id
  LEFT JOIN orders o ON o.store_id = so.store_id
  LEFT JOIN store_inquiries si ON si.store_owner_id = so.id
       ${whereSql}
      GROUP BY so.id, so.store_id, s.store_name, so.login_id, so.name, so.phone, so.email, so.is_active, so.created_at
      ORDER BY s.store_name ASC, so.id DESC`,
    params
  );

  ok(res, { items: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { storeId, loginId, passwordHash, name, phone, email } = req.body;

  if (!storeId) {
    throw new ApiError(400, '매장 ID가 필요합니다.', 'STORE_REQUIRED');
  }

  if (!loginId) {
    throw new ApiError(400, '로그인 ID가 필요합니다.', 'LOGIN_ID_REQUIRED');
  }

  if (!name) {
    throw new ApiError(400, '점주명이 필요합니다.', 'OWNER_NAME_REQUIRED');
  }

  const [result] = await pool.query(
    `INSERT INTO store_owners (
      store_id, login_id, password_hash, name, phone, email
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      store_id = VALUES(store_id),
      name = VALUES(name),
      phone = VALUES(phone),
      email = VALUES(email),
      is_active = 1`,
    [
      storeId,
      loginId,
      passwordHash || '$2b$10$wPHGo9ihOS7ZX7ktoKltFebI6DBP4NxNvi2bcdw7JcF9xbsLLeu3e',
      name,
      phone || null,
      email || null,
    ]
  );

  let id = result.insertId;
  if (!id) {
    const [[owner]] = await pool.query('SELECT id FROM store_owners WHERE login_id = ?', [loginId]);
    id = owner.id;
  }

  created(res, { id });
}));

module.exports = router;
