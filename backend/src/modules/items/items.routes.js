const express = require('express');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok, created } = require('../../utils/response');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const size = Math.min(Math.max(Number(req.query.size) || 100, 1), 300);
  const offset = (page - 1) * size;
  const keyword = req.query.keyword ? `%${req.query.keyword}%` : null;
  const storeId = req.query.storeId || null;
  const machineCatalogId = req.query.machineCatalogId || null;

  if (storeId) {
    const where = ['si.store_id = ?', 'si.is_active = 1', 'i.is_active = 1', '(si.machine_id IS NULL OR m.is_active = 1)'];
    const params = [storeId];

    if (keyword) {
      where.push('(i.name LIKE ? OR i.item_code LIKE ? OR i.keywords LIKE ? OR i.category_name LIKE ? OR i.supplier_name LIKE ?)');
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;
    const [rows] = await pool.query(
      `SELECT i.id, si.id AS storeItemId,
              i.item_code AS itemCode, i.category_name AS categoryName,
              i.supplier_name AS supplierName,
              i.name, i.spec, i.unit, i.purchase_price AS purchasePrice,
              COALESCE(si.store_sale_price, i.sale_price) AS salePrice,
              i.keywords, i.is_active AS isActive,
              si.store_id AS storeId, s.store_name AS storeName,
              si.machine_id AS machineId, m.model_name AS machineName,
              si.memo AS storeItemMemo
         FROM store_items si
         JOIN items i ON i.id = si.item_id
         JOIN stores s ON s.id = si.store_id
    LEFT JOIN machines m ON m.id = si.machine_id
        ${whereSql}
        ORDER BY i.item_code ASC, i.id ASC
        LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM store_items si
         JOIN items i ON i.id = si.item_id
    LEFT JOIN machines m ON m.id = si.machine_id
        ${whereSql}`,
      params
    );

    ok(res, { items: rows, pagination: { page, size, total: countRow.total } });
    return;
  }

  if (machineCatalogId) {
    const where = ['mci.machine_catalog_id = ?', 'mci.is_active = 1', 'i.is_active = 1'];
    const params = [machineCatalogId];

    if (keyword) {
      where.push('(i.name LIKE ? OR i.item_code LIKE ? OR i.keywords LIKE ? OR i.category_name LIKE ? OR i.supplier_name LIKE ?)');
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;
    const [rows] = await pool.query(
      `SELECT i.id, i.item_code AS itemCode, i.category_name AS categoryName,
              i.supplier_name AS supplierName,
              i.name, i.spec, i.unit, i.purchase_price AS purchasePrice,
              i.sale_price AS salePrice, i.keywords, i.is_active AS isActive,
              mci.machine_catalog_id AS machineCatalogId,
              c.model_name AS machineCatalogName,
              mci.memo AS catalogItemMemo
         FROM machine_catalog_items mci
         JOIN items i ON i.id = mci.item_id
         JOIN machine_catalogs c ON c.id = mci.machine_catalog_id
        ${whereSql}
        ORDER BY i.item_code ASC, i.id ASC
        LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM machine_catalog_items mci
         JOIN items i ON i.id = mci.item_id
        ${whereSql}`,
      params
    );

    ok(res, { items: rows, pagination: { page, size, total: countRow.total } });
    return;
  }

  const where = ['is_active = 1'];
  const params = [];

  if (keyword) {
    where.push('(name LIKE ? OR item_code LIKE ? OR keywords LIKE ? OR category_name LIKE ? OR supplier_name LIKE ?)');
    params.push(keyword, keyword, keyword, keyword, keyword);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const [rows] = await pool.query(
    `SELECT id, item_code AS itemCode, category_name AS categoryName,
            supplier_name AS supplierName,
            name, spec, unit, purchase_price AS purchasePrice,
            sale_price AS salePrice, keywords, is_active AS isActive,
            created_at AS createdAt
       FROM items
       ${whereSql}
      ORDER BY item_code ASC, id ASC
      LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  const [[countRow]] = await pool.query(`SELECT COUNT(*) AS total FROM items ${whereSql}`, params);
  ok(res, { items: rows, pagination: { page, size, total: countRow.total } });
}));

router.post('/store-items', asyncHandler(async (req, res) => {
  const storeId = Number(req.body.storeId);
  const itemId = Number(req.body.itemId);
  const machineId = req.body.machineId ? Number(req.body.machineId) : null;
  const storeSalePrice = req.body.storeSalePrice === undefined ? null : Number(req.body.storeSalePrice);

  if (!storeId || !itemId) {
    throw new ApiError(400, '거래처와 품목을 선택해주세요.', 'STORE_ITEM_REQUIRED');
  }

  const [[item]] = await pool.query('SELECT id, sale_price AS salePrice FROM items WHERE id = ? AND is_active = 1', [itemId]);
  if (!item) throw new ApiError(404, '품목을 찾을 수 없습니다.', 'ITEM_NOT_FOUND');

  const [result] = await pool.query(
    `INSERT INTO store_items (store_id, item_id, machine_id, store_sale_price, memo, is_active)
     VALUES (?, ?, ?, ?, '기타 품목 수동 연결', 1)
     ON DUPLICATE KEY UPDATE
       store_sale_price = VALUES(store_sale_price),
       memo = VALUES(memo),
       is_active = 1`,
    [storeId, itemId, machineId, storeSalePrice === null ? item.salePrice : storeSalePrice]
  );

  created(res, { id: result.insertId || itemId });
}));

router.delete('/store-items/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new ApiError(400, '거래처 품목 ID가 필요합니다.', 'STORE_ITEM_ID_REQUIRED');

  const [result] = await pool.query('UPDATE store_items SET is_active = 0 WHERE id = ?', [id]);
  if (!result.affectedRows) throw new ApiError(404, '거래처 품목을 찾을 수 없습니다.', 'STORE_ITEM_NOT_FOUND');

  ok(res, { id });
}));

router.post('/', asyncHandler(async (req, res) => {
  const {
    itemCode,
    categoryName,
    supplierName,
    name,
    spec,
    unit,
    purchasePrice,
    salePrice,
    keywords,
    memo,
    storeId,
    machineId,
    machineCatalogId,
    storeSalePrice,
  } = req.body;

  if (!itemCode) {
    throw new ApiError(400, '품목코드가 필요합니다.', 'ITEM_CODE_REQUIRED');
  }

  if (!name) {
    throw new ApiError(400, '품목명이 필요합니다.', 'ITEM_NAME_REQUIRED');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO items (
        item_code, category_name, supplier_name, name, spec, unit,
        purchase_price, sale_price, keywords, memo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        category_name = VALUES(category_name),
        supplier_name = VALUES(supplier_name),
        name = VALUES(name),
        spec = VALUES(spec),
        unit = VALUES(unit),
        purchase_price = VALUES(purchase_price),
        sale_price = VALUES(sale_price),
        keywords = VALUES(keywords),
        memo = VALUES(memo),
        is_active = 1`,
      [
        itemCode || null,
        categoryName || null,
        supplierName || null,
        name,
        spec || null,
        unit || 'EA',
        Number(purchasePrice) || 0,
        Number(salePrice) || 0,
        keywords || null,
        memo || null,
      ]
    );

    let itemId = result.insertId;
    if (!itemId && itemCode) {
      const [[item]] = await connection.query('SELECT id FROM items WHERE item_code = ?', [itemCode]);
      itemId = item.id;
    }

    if (machineCatalogId) {
      await connection.query(
        `INSERT INTO machine_catalog_items (machine_catalog_id, item_id, memo, is_active)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE memo = VALUES(memo), is_active = 1`,
        [machineCatalogId, itemId, memo || '품목관리에서 머신 연결']
      );

      const [machines] = await connection.query(
        'SELECT id, store_id AS storeId FROM machines WHERE machine_catalog_id = ? AND is_active = 1',
        [machineCatalogId]
      );

      for (const machine of machines) {
        await connection.query(
          `INSERT INTO store_items (store_id, item_id, machine_id, store_sale_price, memo, is_active)
           VALUES (?, ?, ?, ?, '머신 기본 품목 자동 연결', 1)
           ON DUPLICATE KEY UPDATE
             store_sale_price = VALUES(store_sale_price),
             memo = VALUES(memo),
             is_active = 1`,
          [
            machine.storeId,
            itemId,
            machine.id,
            storeSalePrice === undefined || storeSalePrice === null ? Number(salePrice) || 0 : Number(storeSalePrice) || 0,
          ]
        );
      }
    }

    if (storeId) {
      await connection.query(
        `INSERT INTO store_items (store_id, item_id, machine_id, store_sale_price, memo, is_active)
         VALUES (?, ?, ?, ?, '기타 품목 수동 연결', 1)
         ON DUPLICATE KEY UPDATE
           store_sale_price = VALUES(store_sale_price),
           memo = VALUES(memo),
           is_active = 1`,
        [
          storeId,
          itemId,
          machineId || null,
          storeSalePrice === undefined || storeSalePrice === null ? Number(salePrice) || 0 : Number(storeSalePrice) || 0,
        ]
      );
    }

    await connection.commit();
    created(res, { id: itemId });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

module.exports = router;

