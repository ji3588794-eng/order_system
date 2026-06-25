const express = require('express');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok, created } = require('../../utils/response');

const router = express.Router();

router.use((req, res, next) => {
  req.user = req.user || { id: null };
  next();
});

router.get('/', asyncHandler(async (req, res) => {
  const status = req.query.status || null;
  const storeId = req.query.storeId || null;
  const keyword = req.query.keyword ? `%${req.query.keyword}%` : null;
  const where = [];
  const params = [];

  if (status) {
    where.push('si.status = ?');
    params.push(status);
  }

  if (storeId) {
    where.push('si.store_id = ?');
    params.push(storeId);
  }

  if (keyword) {
    where.push('(si.title LIKE ? OR si.content LIKE ? OR s.store_name LIKE ? OR so.name LIKE ?)');
    params.push(keyword, keyword, keyword, keyword);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT si.id, si.store_id AS storeId, s.store_name AS storeName,
            si.store_owner_id AS storeOwnerId, so.name AS ownerName,
            si.inquiry_type AS inquiryType, si.title, si.content,
            si.status, si.answer, si.answered_at AS answeredAt,
            si.created_at AS createdAt
       FROM store_inquiries si
       JOIN stores s ON s.id = si.store_id
  LEFT JOIN store_owners so ON so.id = si.store_owner_id
       ${whereSql}
      ORDER BY si.id DESC`,
    params
  );

  ok(res, { items: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { storeId, storeOwnerId, inquiryType, title, content } = req.body;

  if (!storeId) {
    throw new ApiError(400, '매장 ID가 필요합니다.', 'STORE_REQUIRED');
  }

  if (!title || !content) {
    throw new ApiError(400, '문의 제목과 내용이 필요합니다.', 'INQUIRY_REQUIRED');
  }

  const [result] = await pool.query(
    `INSERT INTO store_inquiries (
      store_id, store_owner_id, inquiry_type, title, content
    ) VALUES (?, ?, ?, ?, ?)`,
    [storeId, storeOwnerId || null, inquiryType || 'ETC', title, content]
  );

  created(res, { id: result.insertId });
}));

router.patch('/:id/answer', asyncHandler(async (req, res) => {
  const { answer, status } = req.body;

  if (!answer) {
    throw new ApiError(400, '답변 내용이 필요합니다.', 'ANSWER_REQUIRED');
  }

  const [result] = await pool.query(
    `UPDATE store_inquiries
        SET answer = ?,
            status = ?,
            answered_by = ?,
            answered_at = NOW()
      WHERE id = ?`,
    [answer, status || 'ANSWERED', req.user.id, req.params.id]
  );

  if (!result.affectedRows) {
    throw new ApiError(404, '문의를 찾을 수 없습니다.', 'INQUIRY_NOT_FOUND');
  }

  ok(res, { id: Number(req.params.id), status: status || 'ANSWERED' });
}));

module.exports = router;
