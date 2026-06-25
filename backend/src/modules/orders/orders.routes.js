const express = require('express');
const crypto = require('crypto');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok, created } = require('../../utils/response');

const router = express.Router();

router.use((req, res, next) => {
  req.user = req.user || { id: null };
  next();
});

const makeOrderNo = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${String(yyyy).slice(2)}${mm}${dd}`;
  const random = crypto.randomBytes(3).toString('hex').slice(0, 4).toUpperCase();
  return `${datePart}${random}`;
};

const normalizePaymentMethod = (value) => {
  if (value === 'CARD' || value === 'BANK_TRANSFER') return value;
  if (value === 'card') return 'CARD';
  if (value === 'bank') return 'BANK_TRANSFER';
  return null;
};

const parseOptionalJson = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const calculateLine = (line) => {
  const quantity = Number(line.quantity);
  const unitPrice = Number(line.unitPrice);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new ApiError(400, '?섎웾? 0蹂대떎 而ㅼ빞 ?⑸땲??', 'INVALID_QUANTITY');
  }

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new ApiError(400, '?④???0 ?댁긽?댁뼱???⑸땲??', 'INVALID_UNIT_PRICE');
  }

  const supplyAmount = Math.round(quantity * unitPrice);
  const vatAmount = line.vatAmount === undefined || line.vatAmount === null
    ? Math.round(supplyAmount * 0.1)
    : Math.round(Number(line.vatAmount));

  return {
    quantity,
    unitPrice,
    supplyAmount,
    vatAmount,
    totalAmount: supplyAmount + vatAmount,
  };
};

const updatePaymentSummary = async (connection, orderId) => {
  const [[order]] = await connection.query(
    'SELECT total_amount AS totalAmount FROM orders WHERE id = ?',
    [orderId]
  );

  const [[payment]] = await connection.query(
    `SELECT COALESCE(SUM(amount), 0) AS paidAmount
       FROM payments
      WHERE order_id = ?
        AND payment_status = 'CONFIRMED'`,
    [orderId]
  );

  const paidAmount = Number(payment.paidAmount);
  let paymentStatus = 'UNPAID';
  let nextOrderStatus = null;

  if (paidAmount >= Number(order.totalAmount) && Number(order.totalAmount) > 0) {
    paymentStatus = 'PAID';
    nextOrderStatus = 'PAYMENT_CONFIRMED';
  } else if (paidAmount > 0) {
    paymentStatus = 'PARTIAL_PAID';
  }

  await connection.query(
    `UPDATE orders
        SET paid_amount = ?,
            payment_status = ?,
            order_status = IF(? IS NULL, order_status, ?)
      WHERE id = ?`,
    [paidAmount, paymentStatus, nextOrderStatus, nextOrderStatus, orderId]
  );
};

router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const size = Math.min(Math.max(Number(req.query.size) || 20, 1), 100);
  const offset = (page - 1) * size;
  const keyword = req.query.keyword ? `%${req.query.keyword}%` : null;
  const orderStatus = req.query.orderStatus || null;
  const paymentStatus = req.query.paymentStatus || null;
  const readyForAdmin = req.query.readyForAdmin === 'true';

  const where = [];
  const params = [];

  if (keyword) {
    where.push('(o.order_no LIKE ? OR s.store_name LIKE ? OR o.request_memo LIKE ?)');
    params.push(keyword, keyword, keyword);
  }

  if (orderStatus) {
    where.push('o.order_status = ?');
    params.push(orderStatus);
  }

  if (paymentStatus) {
    where.push('o.payment_status = ?');
    params.push(paymentStatus);
  }

  if (readyForAdmin) {
    where.push(`o.payment_status IN ('PAID', 'MANUAL_APPROVED')`);
    where.push(`o.order_status NOT IN ('ORDER_IN_PROGRESS', 'SHIPPED', 'COMPLETED', 'CANCELED')`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT o.id, o.order_no AS orderNo, o.order_date AS orderDate, o.due_date AS dueDate,
            s.store_name AS storeName, s.owner_name AS ownerName,
            o.order_status AS orderStatus,
            o.request_channel AS requestChannel,
            o.payment_status AS paymentStatus, o.payment_type AS paymentType,
            o.total_amount AS totalAmount, o.paid_amount AS paidAmount,
            o.created_at AS createdAt,
            (
              SELECT p.payment_method
                FROM payments p
               WHERE p.order_id = o.id
               ORDER BY FIELD(p.payment_status, 'CONFIRMED', 'PENDING', 'CANCELED', 'REFUNDED'), p.id DESC
               LIMIT 1
            ) AS paymentMethod,
            (
              SELECT GROUP_CONCAT(oi.item_name ORDER BY oi.id SEPARATOR ', ')
                FROM order_items oi
               WHERE oi.order_id = o.id
            ) AS itemSummary
       FROM orders o
       JOIN stores s ON s.id = o.store_id
       ${whereSql}
      ORDER BY o.id DESC
      LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  const [[countRow]] = await pool.query(
    `SELECT COUNT(*) AS total
       FROM orders o
       JOIN stores s ON s.id = o.store_id
       ${whereSql}`,
    params
  );

  ok(res, {
    items: rows,
    pagination: { page, size, total: countRow.total },
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [orders] = await pool.query(
    `SELECT o.*, o.order_no AS orderNo, o.order_date AS orderDate, o.due_date AS dueDate,
            o.order_status AS orderStatus, o.payment_status AS paymentStatus,
            o.payment_type AS paymentType, o.request_channel AS requestChannel,
            o.total_amount AS totalAmount, o.paid_amount AS paidAmount,
            s.store_name AS storeName, s.owner_name AS ownerName, s.owner_phone AS ownerPhone,
            s.address1 AS address1, s.address2 AS address2, s.business_number AS businessNumber
       FROM orders o
       JOIN stores s ON s.id = o.store_id
      WHERE o.id = ?`,
    [req.params.id]
  );

  if (!orders.length) {
    throw new ApiError(404, '二쇰Ц??李얠쓣 ???놁뒿?덈떎.', 'ORDER_NOT_FOUND');
  }

  const [items] = await pool.query(
    `SELECT oi.id AS id,
            oi.store_item_id AS storeItemId,
            oi.item_id AS itemId,
            oi.item_code AS itemCode,
            oi.item_name AS itemName,
            oi.spec,
            oi.unit,
            oi.quantity,
            oi.unit_price AS unitPrice,
            oi.supply_amount AS supplyAmount,
            oi.vat_amount AS vatAmount,
            oi.total_amount AS totalAmount,
            oi.memo,
            i.category_name AS categoryName,
            i.supplier_name AS supplierName,
            i.purchase_price AS purchasePrice,
            i.sale_price AS masterSalePrice,
            i.keywords,
            si.store_sale_price AS storeSalePrice,
            si.memo AS storeItemMemo,
            si.is_active AS storeItemActive,
            si.item_scope_key AS itemScopeKey,
            m.id AS machineId,
            m.model_name AS machineModelName,
            mc.machine_code AS machineCode,
            mc.company_name AS machineCompanyName,
            mc.machine_name AS machineName,
            mc.model_name AS machineCatalogModel
       FROM order_items oi
  LEFT JOIN items i ON i.id = oi.item_id
  LEFT JOIN store_items si ON si.id = oi.store_item_id
  LEFT JOIN machines m ON m.id = si.machine_id
  LEFT JOIN machine_catalogs mc ON mc.id = m.machine_catalog_id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC`,
    [req.params.id]
  );

  const [payments] = await pool.query(
    `SELECT id, payment_method AS paymentMethod, payment_status AS paymentStatus,
            amount, payer_name AS payerName, paid_at AS paidAt, memo,
            provider, provider_payment_key AS providerPaymentKey,
            provider_order_id AS providerOrderId, receipt_url AS receiptUrl,
            accounting_status AS accountingStatus, created_at AS createdAt
       FROM payments
      WHERE order_id = ?
      ORDER BY id DESC`,
    [req.params.id]
  );

  ok(res, { order: orders[0], items, payments });
}));

router.post('/', asyncHandler(async (req, res) => {
  const {
    storeId,
    orderDate,
    dueDate,
    requestChannel,
    paymentType,
    paymentMethod,
    payerName,
    requestMemo,
    adminMemo,
    manualApproved,
    manualApprovalReason,
    items,
  } = req.body;

  if (!storeId) {
    throw new ApiError(400, '嫄곕옒泥?ID???꾩닔?낅땲??', 'STORE_REQUIRED');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, '二쇰Ц ?덈ぉ? 1媛??댁긽 ?꾩슂?⑸땲??', 'ORDER_ITEMS_REQUIRED');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[store]] = await connection.query(
      'SELECT id, payment_type AS paymentType FROM stores WHERE id = ? AND is_active = 1',
      [storeId]
    );

    if (!store) {
      throw new ApiError(400, '嫄곕옒泥섎? 李얠쓣 ???놁뒿?덈떎.', 'STORE_NOT_FOUND');
    }

    const calculatedItems = items.map((line) => ({ ...line, ...calculateLine(line) }));
    const totals = calculatedItems.reduce(
      (sum, line) => ({
        supplyAmount: sum.supplyAmount + line.supplyAmount,
        vatAmount: sum.vatAmount + line.vatAmount,
        totalAmount: sum.totalAmount + line.totalAmount,
      }),
      { supplyAmount: 0, vatAmount: 0, totalAmount: 0 }
    );

    const effectivePaymentType = paymentType || store.paymentType || 'PREPAID';
    const effectivePaymentMethod = normalizePaymentMethod(paymentMethod);
    const isManualApproved = Boolean(manualApproved);
    const paymentStatus = isManualApproved
      ? 'MANUAL_APPROVED'
      : effectivePaymentType === 'MONTHLY'
        ? 'MONTHLY_BILLING'
        : 'UNPAID';
    const orderStatus = isManualApproved
      ? 'MANUAL_APPROVED'
      : effectivePaymentMethod
        ? 'PAYMENT_REQUESTED'
        : 'STATEMENT_READY';
    const orderNo = makeOrderNo();

    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_no, store_id, order_date, due_date, request_channel,
        order_status, payment_status, payment_type,
        supply_amount, vat_amount, total_amount,
        request_memo, admin_memo, manual_approved_by, manual_approved_reason,
        manual_approved_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo,
        storeId,
        orderDate || new Date(),
        dueDate || null,
        requestChannel || 'ADMIN',
        orderStatus,
        paymentStatus,
        effectivePaymentType,
        totals.supplyAmount,
        totals.vatAmount,
        totals.totalAmount,
        requestMemo || null,
        adminMemo || null,
        isManualApproved ? req.user.id : null,
        isManualApproved ? manualApprovalReason || '愿由ъ옄 ?섎룞?덉쇅 二쇰Ц' : null,
        isManualApproved ? new Date() : null,
        req.user.id,
      ]
    );

    if (!isManualApproved && effectivePaymentMethod) {
      await connection.query(
        `INSERT INTO payments (
          order_id, payment_method, payment_status, amount, payer_name, memo, created_by
        ) VALUES (?, ?, 'PENDING', ?, ?, ?, ?)`,
        [
          orderResult.insertId,
          effectivePaymentMethod,
          totals.totalAmount,
          payerName || null,
          effectivePaymentMethod === 'BANK_TRANSFER'
            ? 'Bank transfer requested from user order'
            : 'Toss card payment requested from user order',
          req.user.id,
        ]
      );
    }

    for (const line of calculatedItems) {
      if (!line.itemName) {
        throw new ApiError(400, '?덈ぉ紐낆? ?꾩닔?낅땲??', 'ITEM_NAME_REQUIRED');
      }

      let itemId = line.itemId || null;
      let storeItemId = line.storeItemId || null;
      if (itemId) {
        const [[item]] = await connection.query('SELECT id FROM items WHERE id = ?', [itemId]);
        itemId = item ? item.id : null;
      }

      if (!storeItemId && itemId) {
        const [[storeItem]] = await connection.query(
          `SELECT si.id
             FROM store_items si
             LEFT JOIN machines m ON m.id = si.machine_id
            WHERE si.store_id = ?
              AND si.item_id = ?
              AND si.is_active = 1
              AND (si.machine_id IS NULL OR m.is_active = 1)
            ORDER BY si.machine_id IS NULL ASC, si.id DESC
            LIMIT 1`,
          [storeId, itemId]
        );
        storeItemId = storeItem?.id || null;
      }

      await connection.query(
        `INSERT INTO order_items (
          order_id, store_item_id, item_id, item_code, item_name, spec, unit,
          quantity, unit_price, supply_amount, vat_amount, total_amount, memo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderResult.insertId,
          storeItemId,
          itemId,
          line.itemCode || null,
          line.itemName,
          line.spec || null,
          line.unit || 'EA',
          line.quantity,
          line.unitPrice,
          line.supplyAmount,
          line.vatAmount,
          line.totalAmount,
          line.memo || null,
        ]
      );
    }

    await connection.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, memo, changed_by)
       VALUES (?, NULL, ?, ?, ?)`,
      [
        orderResult.insertId,
        orderStatus,
        isManualApproved ? manualApprovalReason || '愿由ъ옄 ?섎룞?덉쇅 二쇰Ц' : '二쇰Ц ?낅젰 諛?寃곗젣?湲??앹꽦',
        req.user.id,
      ]
    );

    await connection.commit();
    created(res, { id: orderResult.insertId, orderNo });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { orderStatus, memo } = req.body;

  if (!orderStatus) {
    throw new ApiError(400, '蹂寃쏀븷 二쇰Ц ?곹깭媛 ?꾩슂?⑸땲??', 'ORDER_STATUS_REQUIRED');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[order]] = await connection.query(
      'SELECT id, order_status AS orderStatus, payment_status AS paymentStatus FROM orders WHERE id = ?',
      [req.params.id]
    );

    if (!order) {
      throw new ApiError(404, '二쇰Ц??李얠쓣 ???놁뒿?덈떎.', 'ORDER_NOT_FOUND');
    }

    const blockedStatuses = ['ORDER_IN_PROGRESS', 'SHIPPED', 'COMPLETED'];
    const canProceed = ['PAID', 'MONTHLY_BILLING', 'MANUAL_APPROVED'].includes(order.paymentStatus);

    if (blockedStatuses.includes(orderStatus) && !canProceed) {
      throw new ApiError(409, '寃곗젣?꾨즺 ?먮뒗 愿由ъ옄 ?섎룞?덉쇅 ?뱀씤 ??諛쒖＜ 吏꾪뻾??媛?ν빀?덈떎.', 'PAYMENT_REQUIRED');
    }

    await connection.query('UPDATE orders SET order_status = ? WHERE id = ?', [orderStatus, req.params.id]);
    await connection.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, memo, changed_by)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.id, order.orderStatus, orderStatus, memo || null, req.user.id]
    );

    await connection.commit();
    ok(res, { id: Number(req.params.id), orderStatus });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

async function createConfirmedPayment(req, res, sourceLabel) {
  const { paymentMethod, amount, payerName, paidAt, memo } = req.body;
  const requestedPaymentMethod = normalizePaymentMethod(paymentMethod);

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, '결제 금액은 0보다 커야 합니다.', 'INVALID_PAYMENT_AMOUNT');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[order]] = await connection.query('SELECT id FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      throw new ApiError(404, '주문을 찾을 수 없습니다.', 'ORDER_NOT_FOUND');
    }

    const [[pendingPayment]] = await connection.query(
      `SELECT id, payment_method AS paymentMethod
         FROM payments
        WHERE order_id = ?
          AND payment_status = 'PENDING'
        ORDER BY id DESC
        LIMIT 1`,
      [req.params.id]
    );
    const effectivePaymentMethod = requestedPaymentMethod || pendingPayment?.paymentMethod || 'BANK_TRANSFER';
    let paymentId = pendingPayment?.id || null;

    if (pendingPayment) {
      await connection.query(
        `UPDATE payments
            SET payment_method = ?,
                payment_status = 'CONFIRMED',
                amount = ?,
                payer_name = ?,
                paid_at = ?,
                memo = ?,
                created_by = ?
          WHERE id = ?`,
        [
          effectivePaymentMethod,
          Number(amount),
          payerName || null,
          paidAt || new Date(),
          memo || sourceLabel,
          req.user.id,
          pendingPayment.id,
        ]
      );
    } else {
      const [result] = await connection.query(
        `INSERT INTO payments (
          order_id, payment_method, payment_status, amount, payer_name, paid_at, memo, created_by
        ) VALUES (?, ?, 'CONFIRMED', ?, ?, ?, ?, ?)`,
        [
          req.params.id,
          effectivePaymentMethod,
          Number(amount),
          payerName || null,
          paidAt || new Date(),
          memo || sourceLabel,
          req.user.id,
        ]
      );
      paymentId = result.insertId;
    }

    await updatePaymentSummary(connection, req.params.id);

    await connection.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, memo, changed_by)
       VALUES (?, NULL, 'PAYMENT_CONFIRMED', ?, ?)`,
      [req.params.id, sourceLabel, req.user.id]
    );

    await connection.commit();
    created(res, { id: paymentId, paymentMethod: effectivePaymentMethod });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

router.post('/:id/payments', asyncHandler(async (req, res) => {
  await createConfirmedPayment(req, res, '관리자 결제확인');
}));

router.post('/:id/shop-payment', asyncHandler(async (req, res) => {
  await createConfirmedPayment(req, res, '관리자 입금 확인');
}));

router.post('/:id/toss-payment', asyncHandler(async (req, res) => {
  const { paymentKey, orderId, amount, payerName, approvedAt, receiptUrl, rawPayload } = req.body;

  if (!paymentKey || !orderId) {
    throw new ApiError(400, 'Toss payment key and order id are required.', 'TOSS_PAYMENT_REQUIRED');
  }

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, 'Payment amount must be greater than zero.', 'INVALID_PAYMENT_AMOUNT');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[order]] = await connection.query(
      'SELECT id, order_no AS orderNo FROM orders WHERE id = ?',
      [req.params.id]
    );

    if (!order) {
      throw new ApiError(404, 'Order not found.', 'ORDER_NOT_FOUND');
    }

    const [[pendingPayment]] = await connection.query(
      `SELECT id
         FROM payments
        WHERE order_id = ?
          AND payment_method = 'CARD'
          AND payment_status = 'PENDING'
        ORDER BY id DESC
        LIMIT 1`,
      [req.params.id]
    );

    const payloadJson = parseOptionalJson(rawPayload);
    const paidAt = approvedAt ? new Date(approvedAt) : new Date();

    if (pendingPayment) {
      await connection.query(
        `UPDATE payments
            SET payment_status = 'CONFIRMED',
                amount = ?,
                payer_name = ?,
                paid_at = ?,
                memo = ?,
                provider = 'TOSS',
                provider_payment_key = ?,
                provider_order_id = ?,
                receipt_url = ?,
                raw_payload = ?
          WHERE id = ?`,
        [
          Number(amount),
          payerName || null,
          paidAt,
          'Toss card payment confirmed',
          paymentKey,
          orderId,
          receiptUrl || null,
          payloadJson,
          pendingPayment.id,
        ]
      );
    } else {
      await connection.query(
        `INSERT INTO payments (
          order_id, payment_method, payment_status, amount, payer_name, paid_at, memo,
          provider, provider_payment_key, provider_order_id, receipt_url, raw_payload, created_by
        ) VALUES (?, 'CARD', 'CONFIRMED', ?, ?, ?, ?, 'TOSS', ?, ?, ?, ?, ?)`,
        [
          req.params.id,
          Number(amount),
          payerName || null,
          paidAt,
          'Toss card payment confirmed',
          paymentKey,
          orderId,
          receiptUrl || null,
          payloadJson,
          req.user.id,
        ]
      );
    }

    await updatePaymentSummary(connection, req.params.id);

    await connection.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, memo, changed_by)
       VALUES (?, NULL, 'PAYMENT_CONFIRMED', ?, ?)`,
      [req.params.id, 'Toss card payment confirmed', req.user.id]
    );

    await connection.commit();
    ok(res, { id: Number(req.params.id), orderNo: order.orderNo, paymentStatus: 'PAID' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.post('/:id/manual-approval', asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    throw new ApiError(400, '?덉쇅 ?뱀씤 ?ъ쑀???꾩닔?낅땲??', 'MANUAL_APPROVAL_REASON_REQUIRED');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[order]] = await connection.query(
      'SELECT id, order_status AS orderStatus FROM orders WHERE id = ?',
      [req.params.id]
    );

    if (!order) {
      throw new ApiError(404, '二쇰Ц??李얠쓣 ???놁뒿?덈떎.', 'ORDER_NOT_FOUND');
    }

    await connection.query(
      `UPDATE orders
          SET payment_status = 'MANUAL_APPROVED',
              order_status = 'MANUAL_APPROVED',
              manual_approved_by = ?,
              manual_approved_reason = ?,
              manual_approved_at = NOW()
        WHERE id = ?`,
      [req.user.id, reason, req.params.id]
    );

    await connection.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, memo, changed_by)
       VALUES (?, ?, 'MANUAL_APPROVED', ?, ?)`,
      [req.params.id, order.orderStatus, reason, req.user.id]
    );

    await connection.commit();
    ok(res, { id: Number(req.params.id), paymentStatus: 'MANUAL_APPROVED' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

module.exports = router;

