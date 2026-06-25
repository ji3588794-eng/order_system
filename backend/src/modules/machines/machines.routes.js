const express = require('express');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok, created } = require('../../utils/response');

const router = express.Router();

function generateMachineCode() {
  return `MC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function syncStoreItemsForMachine(connection, machineId) {
  const [[machine]] = await connection.query(
    `SELECT id, store_id AS storeId, machine_catalog_id AS catalogId
       FROM machines
      WHERE id = ?`,
    [machineId]
  );

  if (!machine || !machine.catalogId) return 0;

  const [catalogItems] = await connection.query(
    `SELECT mci.item_id AS itemId, i.sale_price AS salePrice
       FROM machine_catalog_items mci
       JOIN items i ON i.id = mci.item_id
      WHERE mci.machine_catalog_id = ?
        AND mci.is_active = 1
        AND i.is_active = 1`,
    [machine.catalogId]
  );

  for (const item of catalogItems) {
    await connection.query(
      `INSERT INTO store_items (store_id, item_id, machine_id, store_sale_price, memo, is_active)
       VALUES (?, ?, ?, ?, '머신 기본 품목 자동 연결', 1)
       ON DUPLICATE KEY UPDATE
         store_sale_price = VALUES(store_sale_price),
         memo = VALUES(memo),
         is_active = 1`,
      [machine.storeId, item.itemId, machine.id, item.salePrice]
    );
  }

  return catalogItems.length;
}

router.get('/catalogs', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.id,
            c.machine_code AS machineCode,
            c.company_name AS companyName,
            c.machine_name AS machineName,
            c.model_name AS modelName,
            c.memo,
            c.is_active AS isActive,
            COUNT(CASE WHEN mci.is_active = 1 AND i.is_active = 1 THEN mci.id END) AS itemCount
       FROM machine_catalogs c
  LEFT JOIN machine_catalog_items mci ON mci.machine_catalog_id = c.id
  LEFT JOIN items i ON i.id = mci.item_id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY FIELD(c.model_name, 'SV1', 'A1', 'M시리즈'), c.id ASC`
  );

  ok(res, { items: rows });
}));

router.get('/catalogs/:id/items', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT i.id,
            i.item_code AS itemCode,
            i.category_name AS categoryName,
            i.name,
            i.spec,
            i.unit,
            i.purchase_price AS purchasePrice,
            i.sale_price AS salePrice,
            i.keywords,
            i.is_active AS isActive,
            mci.memo AS catalogItemMemo
       FROM machine_catalog_items mci
       JOIN items i ON i.id = mci.item_id
      WHERE mci.machine_catalog_id = ?
        AND mci.is_active = 1
        AND i.is_active = 1
      ORDER BY i.item_code ASC, i.id ASC`,
    [req.params.id]
  );

  ok(res, { items: rows });
}));

router.post('/catalogs/:id/items', asyncHandler(async (req, res) => {
  const catalogId = Number(req.params.id);
  const itemId = Number(req.body.itemId);
  const memo = req.body.memo || '머신 품목 연결';

  if (!catalogId || !itemId) {
    throw new ApiError(400, '머신과 품목을 선택해주세요.', 'CATALOG_ITEM_REQUIRED');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[catalog]] = await connection.query('SELECT id FROM machine_catalogs WHERE id = ? AND is_active = 1', [catalogId]);
    if (!catalog) throw new ApiError(404, '머신을 찾을 수 없습니다.', 'CATALOG_NOT_FOUND');

    const [[item]] = await connection.query('SELECT id FROM items WHERE id = ? AND is_active = 1', [itemId]);
    if (!item) throw new ApiError(404, '품목을 찾을 수 없습니다.', 'ITEM_NOT_FOUND');

    await connection.query(
      `INSERT INTO machine_catalog_items (machine_catalog_id, item_id, memo, is_active)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE memo = VALUES(memo), is_active = 1`,
      [catalogId, itemId, memo]
    );

    const [machines] = await connection.query('SELECT id FROM machines WHERE machine_catalog_id = ? AND is_active = 1', [catalogId]);
    for (const machine of machines) {
      await syncStoreItemsForMachine(connection, machine.id);
    }

    await connection.commit();
    created(res, { id: itemId, syncedMachines: machines.length });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.delete('/catalogs/:id/items/:itemId', asyncHandler(async (req, res) => {
  const catalogId = Number(req.params.id);
  const itemId = Number(req.params.itemId);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE machine_catalog_items SET is_active = 0 WHERE machine_catalog_id = ? AND item_id = ?',
      [catalogId, itemId]
    );

    await connection.query(
      `UPDATE store_items si
          JOIN machines m ON m.id = si.machine_id
           SET si.is_active = 0
         WHERE m.machine_catalog_id = ?
           AND si.item_id = ?
           AND si.memo = '머신 기본 품목 자동 연결'`,
      [catalogId, itemId]
    );

    await connection.commit();
    ok(res, { id: itemId });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.get('/', asyncHandler(async (req, res) => {
  const storeId = req.query.storeId || null;
  const keyword = req.query.keyword ? `%${req.query.keyword}%` : null;
  const where = [];
  const params = [];

  if (storeId) {
    where.push('m.store_id = ?');
    params.push(storeId);
  }

  if (keyword) {
    where.push('(m.machine_code LIKE ? OR m.model_name LIKE ? OR m.serial_number LIKE ? OR s.store_name LIKE ? OR c.company_name LIKE ?)');
    params.push(keyword, keyword, keyword, keyword, keyword);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT m.id,
            m.store_id AS storeId,
            s.store_name AS storeName,
            m.machine_catalog_id AS machineCatalogId,
            c.machine_code AS machineCatalogCode,
            c.company_name AS companyName,
            c.machine_name AS machineCatalogName,
            m.machine_code AS machineCode,
            m.machine_name AS machineName,
            m.model_name AS modelName,
            m.serial_number AS serialNumber,
            m.installed_at AS installedAt,
            m.memo,
            m.is_active AS isActive,
            COUNT(CASE WHEN si.is_active = 1 THEN si.id END) AS itemCount,
            m.created_at AS createdAt
       FROM machines m
       JOIN stores s ON s.id = m.store_id
  LEFT JOIN machine_catalogs c ON c.id = m.machine_catalog_id
  LEFT JOIN store_items si ON si.machine_id = m.id
       ${whereSql}
      GROUP BY m.id
      ORDER BY s.store_name ASC, m.id DESC`,
    params
  );

  ok(res, { items: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { storeId, machineCatalogId, machineCode, serialNumber, installedAt, memo } = req.body;

  if (!storeId) {
    throw new ApiError(400, '거래처를 선택해주세요.', 'STORE_REQUIRED');
  }

  if (!machineCatalogId) {
    throw new ApiError(400, '머신 모델을 선택해주세요.', 'CATALOG_REQUIRED');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[catalog]] = await connection.query(
      'SELECT id, company_name AS companyName, machine_name AS machineName, model_name AS modelName FROM machine_catalogs WHERE id = ? AND is_active = 1',
      [machineCatalogId]
    );
    if (!catalog) throw new ApiError(404, '머신을 찾을 수 없습니다.', 'CATALOG_NOT_FOUND');

    const finalMachineCode = machineCode || generateMachineCode();

    const [result] = await connection.query(
      `INSERT INTO machines (
        store_id, machine_catalog_id, machine_code, machine_name, model_name,
        serial_number, installed_at, memo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        store_id = VALUES(store_id),
        machine_catalog_id = VALUES(machine_catalog_id),
        machine_name = VALUES(machine_name),
        model_name = VALUES(model_name),
        serial_number = VALUES(serial_number),
        installed_at = VALUES(installed_at),
        memo = VALUES(memo),
        is_active = 1`,
      [
        storeId,
        catalog.id,
        finalMachineCode,
        catalog.companyName,
        catalog.modelName,
        serialNumber || null,
        installedAt || null,
        memo || '거래처별 사용 머신',
      ]
    );

    let id = result.insertId;
    if (!id) {
      const [[machine]] = await connection.query('SELECT id FROM machines WHERE machine_code = ?', [finalMachineCode]);
      id = machine.id;
    }

    const syncedItemCount = await syncStoreItemsForMachine(connection, id);

    await connection.commit();
    created(res, { id, machineCode: finalMachineCode, syncedItemCount });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

module.exports = router;
