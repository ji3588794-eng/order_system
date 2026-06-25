const express = require('express');
const crypto = require('crypto');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok, created } = require('../../utils/response');

const router = express.Router();

function normalizeClosureStatus(value) {
  return value === '폐업' ? '폐업' : '운영중';
}

function makeStoreUid() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(3).toString('hex').slice(0, 4).toUpperCase();
  return `S${yy}${mm}${dd}${random}`;
}

function normalizeStorePayload(body) {
  const {
    storeUid,
    storeCode,
    storeName,
    taxInvoiceCode,
    taxInvoiceName,
    machineVendor,
    machineCatalogId,
    deviceNumber,
    ownerName,
    ownerPhone,
    representativeName,
    contact1,
    contact2,
    businessNumber,
    address1,
    address2,
    machineName,
    beanName,
    asContent,
    installedAt,
    filterReplacedAt,
    closureStatus,
    paymentType,
    memo,
  } = body;

  const nextStoreUid = storeUid || null;
  const nextStoreCode = storeCode || taxInvoiceCode || null;
  const nextStoreName = storeName || taxInvoiceName;

  if (!nextStoreName) {
    throw new ApiError(400, '嫄곕옒泥섎챸 ?먮뒗 ?멸툑怨꾩궛??諛쒗뻾紐낆씠 ?꾩슂?⑸땲??', 'STORE_NAME_REQUIRED');
  }

  const nextClosureStatus = normalizeClosureStatus(closureStatus);

  return {
    storeUid: nextStoreUid,
    storeCode: nextStoreCode,
    storeName: nextStoreName,
    taxInvoiceCode: taxInvoiceCode || nextStoreCode,
    taxInvoiceName: taxInvoiceName || nextStoreName,
    machineVendor: machineVendor || null,
    machineCatalogId: Number(machineCatalogId) || null,
    deviceNumber: deviceNumber || null,
    ownerName: representativeName || ownerName || null,
    ownerPhone: contact1 || ownerPhone || null,
    contact2: contact2 || null,
    businessNumber: businessNumber || null,
    address1: address1 || null,
    address2: address2 || null,
    machineName: machineName || null,
    beanName: beanName || null,
    asContent: asContent || null,
    closureStatus: nextClosureStatus,
    isActive: nextClosureStatus === '폐업' ? 0 : 1,
    installedAt: installedAt || null,
    filterReplacedAt: filterReplacedAt || null,
    paymentType: paymentType || 'PREPAID',
    memo: memo || null,
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const size = Math.min(Math.max(Number(req.query.size) || 20, 1), 500);
  const offset = (page - 1) * size;
  const keyword = req.query.keyword ? `%${req.query.keyword}%` : null;
  const where = keyword
    ? `WHERE s.store_name LIKE ?
        OR s.tax_invoice_code LIKE ?
        OR s.tax_invoice_name LIKE ?
        OR s.machine_vendor LIKE ?
        OR s.device_number LIKE ?
        OR s.machine_name LIKE ?
        OR mc.machine_code LIKE ?
        OR mc.model_name LIKE ?
        OR mc.company_name LIKE ?
        OR s.bean_name LIKE ?
        OR s.owner_name LIKE ?
        OR s.owner_phone LIKE ?
        OR s.contact_phone2 LIKE ?
        OR s.address1 LIKE ?
        OR s.address2 LIKE ?
        OR s.as_content LIKE ?
        OR s.closure_status LIKE ?`
    : '';
  const params = keyword ? Array(17).fill(keyword) : [];

  const [rows] = await pool.query(
    `SELECT s.id,
            s.store_uid AS storeUid,
            s.store_code AS storeCode,
            s.store_name AS storeName,
            s.tax_invoice_code AS taxInvoiceCode,
            s.tax_invoice_name AS taxInvoiceName,
            s.business_number AS businessNumber,
            s.machine_vendor AS machineVendor,
            s.device_number AS deviceNumber,
            s.machine_name AS machineName,
            m.machine_catalog_id AS machineCatalogId,
            mc.machine_code AS machineCode,
            mc.company_name AS machineCompanyName,
            mc.model_name AS machineModelName,
            COALESCE(mc.model_name, s.machine_name) AS machineNames,
            s.bean_name AS beanName,
            s.owner_name AS ownerName,
            s.owner_name AS representativeName,
            s.owner_phone AS ownerPhone,
            s.owner_phone AS contact1,
            s.contact_phone2 AS contact2,
            s.address1,
            s.address2,
            s.as_content AS asContent,
            s.closure_status AS closureStatus,
            s.installed_at AS installedAt,
            s.filter_replaced_at AS filterReplacedAt,
            s.payment_type AS paymentType,
            s.is_active AS isActive,
            s.created_at AS createdAt
       FROM stores s
       LEFT JOIN machines m
              ON m.id = (
                SELECT sm.id
                  FROM machines sm
                 WHERE sm.store_id = s.id
                   AND sm.is_active = 1
                 ORDER BY sm.id DESC
                 LIMIT 1
              )
       LEFT JOIN machine_catalogs mc
              ON mc.id = m.machine_catalog_id
       ${where}
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  const [[countRow]] = await pool.query(
    `SELECT COUNT(DISTINCT s.id) AS total
       FROM stores s
       LEFT JOIN machines m
              ON m.id = (
                SELECT sm.id
                  FROM machines sm
                 WHERE sm.store_id = s.id
                   AND sm.is_active = 1
                 ORDER BY sm.id DESC
                 LIMIT 1
              )
       LEFT JOIN machine_catalogs mc
              ON mc.id = m.machine_catalog_id
       ${where}`,
    params
  );

  ok(res, {
    items: rows,
    pagination: { page, size, total: countRow.total },
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const store = normalizeStorePayload(req.body);
  if (!store.storeUid) {
    store.storeUid = makeStoreUid();
  }
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO stores (
        store_uid, store_code, store_name, tax_invoice_code, tax_invoice_name, machine_vendor,
        device_number, owner_name, owner_phone, contact_phone2, business_number, address1, address2,
        machine_name, bean_name, as_content, closure_status, installed_at, filter_replaced_at,
        payment_type, memo, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        store_name = VALUES(store_name),
        tax_invoice_code = VALUES(tax_invoice_code),
        tax_invoice_name = VALUES(tax_invoice_name),
        machine_vendor = VALUES(machine_vendor),
        device_number = VALUES(device_number),
        owner_name = VALUES(owner_name),
        owner_phone = VALUES(owner_phone),
        contact_phone2 = VALUES(contact_phone2),
        business_number = VALUES(business_number),
        address1 = VALUES(address1),
        address2 = VALUES(address2),
        machine_name = VALUES(machine_name),
        bean_name = VALUES(bean_name),
        as_content = VALUES(as_content),
        closure_status = VALUES(closure_status),
        installed_at = VALUES(installed_at),
        filter_replaced_at = VALUES(filter_replaced_at),
        payment_type = VALUES(payment_type),
        memo = VALUES(memo),
        is_active = VALUES(is_active)`,
      storeValues(store)
    );

    const id = result.insertId || (await findStoreId(connection, store.storeUid, store.storeName));
    await syncStoreMachine(connection, id, store.machineCatalogId, store.installedAt, store.deviceNumber);
    await connection.commit();
    created(res, { id });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    throw new ApiError(400, '嫄곕옒泥?ID媛 ?꾩슂?⑸땲??', 'STORE_ID_REQUIRED');
  }

  const store = normalizeStorePayload(req.body);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    if (!store.storeUid) {
      const [[currentStore]] = await connection.query('SELECT store_uid AS storeUid FROM stores WHERE id = ?', [id]);
      store.storeUid = currentStore?.storeUid || makeStoreUid();
    }
    const [result] = await connection.query(
      `UPDATE stores
          SET store_uid = ?,
              store_code = ?,
              store_name = ?,
              tax_invoice_code = ?,
              tax_invoice_name = ?,
              machine_vendor = ?,
              device_number = ?,
              owner_name = ?,
              owner_phone = ?,
              contact_phone2 = ?,
              business_number = ?,
              address1 = ?,
              address2 = ?,
              machine_name = ?,
              bean_name = ?,
              as_content = ?,
              closure_status = ?,
              installed_at = ?,
              filter_replaced_at = ?,
              payment_type = ?,
              memo = ?,
              is_active = ?
        WHERE id = ?`,
      [...storeValues(store), id]
    );

    if (!result.affectedRows) {
      throw new ApiError(404, '嫄곕옒泥섎? 李얠쓣 ???놁뒿?덈떎.', 'STORE_NOT_FOUND');
    }

    await syncStoreMachine(connection, id, store.machineCatalogId, store.installedAt, store.deviceNumber);
    await connection.commit();
    ok(res, { id });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.patch('/:id/closure', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const closureStatus = normalizeClosureStatus(req.body.closureStatus);
  if (!id) {
    throw new ApiError(400, '嫄곕옒泥?ID媛 ?꾩슂?⑸땲??', 'STORE_ID_REQUIRED');
  }

  const [result] = await pool.query(
    'UPDATE stores SET closure_status = ?, is_active = ? WHERE id = ?',
    [closureStatus, closureStatus === '폐업' ? 0 : 1, id]
  );

  if (!result.affectedRows) {
    throw new ApiError(404, '嫄곕옒泥섎? 李얠쓣 ???놁뒿?덈떎.', 'STORE_NOT_FOUND');
  }

  ok(res, { id, closureStatus });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    throw new ApiError(400, '嫄곕옒泥?ID媛 ?꾩슂?⑸땲??', 'STORE_ID_REQUIRED');
  }

  const [result] = await pool.query(
    "UPDATE stores SET closure_status = '폐업', is_active = 0 WHERE id = ?",
    [id]
  );
  if (!result.affectedRows) {
    throw new ApiError(404, '嫄곕옒泥섎? 李얠쓣 ???놁뒿?덈떎.', 'STORE_NOT_FOUND');
  }

  ok(res, { id, closureStatus: '폐업' });
}));

function storeValues(store) {
  return [
    store.storeUid,
    store.storeCode,
    store.storeName,
    store.taxInvoiceCode,
    store.taxInvoiceName,
    store.machineVendor,
    store.deviceNumber,
    store.ownerName,
    store.ownerPhone,
    store.contact2,
    store.businessNumber,
    store.address1,
    store.address2,
    store.machineName,
    store.beanName,
    store.asContent,
    store.closureStatus,
    store.installedAt,
    store.filterReplacedAt,
    store.paymentType,
    store.memo,
    store.isActive,
  ];
}

async function syncStoreMachine(connection, storeId, machineCatalogId, installedAt, deviceNumber) {
  await connection.query('UPDATE machines SET is_active = 0 WHERE store_id = ?', [storeId]);

  if (!machineCatalogId) return;

  const [[catalog]] = await connection.query(
    `SELECT id, company_name AS companyName, machine_name AS machineName, model_name AS modelName
       FROM machine_catalogs
      WHERE id = ?
        AND is_active = 1`,
    [machineCatalogId]
  );

  if (!catalog) {
    throw new ApiError(400, '?좏깮??癒몄떊??李얠쓣 ???놁뒿?덈떎.', 'MACHINE_CATALOG_NOT_FOUND');
  }

  let machineId = await findStoreMachineId(connection, storeId, machineCatalogId);
  if (machineId) {
    await connection.query(
      `UPDATE machines
          SET machine_name = ?,
              model_name = ?,
              serial_number = ?,
              installed_at = ?,
              memo = ?,
              is_active = 1
        WHERE id = ?`,
      [
        catalog.companyName || catalog.machineName || catalog.modelName,
        catalog.modelName,
        deviceNumber || null,
        installedAt || null,
        '嫄곕옒泥섍?由ъ뿉???좏깮??癒몄떊',
        machineId,
      ]
    );
  } else {
    const [machineResult] = await connection.query(
      `INSERT INTO machines (
         store_id, machine_catalog_id, machine_code, machine_name, model_name, serial_number, installed_at, memo, is_active
       ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 1)`,
      [
        storeId,
        machineCatalogId,
        catalog.companyName || catalog.machineName || catalog.modelName,
        catalog.modelName,
        deviceNumber || null,
        installedAt || null,
        '嫄곕옒泥섍?由ъ뿉???좏깮??癒몄떊',
      ]
    );
    machineId = machineResult.insertId;
  }

  await connection.query(
    `UPDATE store_items
        SET is_active = 0
      WHERE store_id = ?
        AND machine_id IS NOT NULL
        AND machine_id <> ?`,
    [storeId, machineId]
  );

  await syncStoreMachineItems(connection, storeId, machineId, machineCatalogId);
}

async function syncStoreMachineItems(connection, storeId, machineId, machineCatalogId) {
  const [items] = await connection.query(
    `SELECT item_id AS itemId
       FROM machine_catalog_items
      WHERE machine_catalog_id = ?
        AND is_active = 1`,
    [machineCatalogId]
  );

  for (const item of items) {
    await connection.query(
      `INSERT INTO store_items (store_id, item_id, machine_id, store_sale_price, memo, is_active)
       SELECT ?, i.id, ?, i.sale_price, ?, 1
         FROM items i
        WHERE i.id = ?
       ON DUPLICATE KEY UPDATE
         machine_id = VALUES(machine_id),
         store_sale_price = COALESCE(store_items.store_sale_price, VALUES(store_sale_price)),
         memo = VALUES(memo),
         is_active = 1`,
      [storeId, machineId, '머신 기본 품목 자동 연결', item.itemId]
    );
  }
}

async function findStoreMachineId(connection, storeId, machineCatalogId) {
  const [[row]] = await connection.query(
    `SELECT id
       FROM machines
      WHERE store_id = ?
        AND machine_catalog_id = ?
      ORDER BY id DESC
      LIMIT 1`,
    [storeId, machineCatalogId]
  );
  return row?.id || null;
}

async function findStoreId(connection, storeUid, storeName) {
  const params = storeUid ? [storeUid] : [storeName];
  const where = storeUid ? 'store_uid = ?' : 'store_name = ?';
  const [[row]] = await connection.query(`SELECT id FROM stores WHERE ${where} ORDER BY id DESC LIMIT 1`, params);
  return row?.id || null;
}

module.exports = router;


