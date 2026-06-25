const express = require('express');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok, created } = require('../../utils/response');

const router = express.Router();

const HANA_REFRESH_COOLDOWN_MS = Number(process.env.HANA_B2B_REFRESH_COOLDOWN_MS || 60_000);
let lastHanaRefreshAt = 0;

const toNumber = (value) => Number(String(value || '0').replace(/[^0-9.-]/g, '')) || 0;

function hanaConfig() {
  const baseUrl = process.env.HANA_B2B_BASE_URL || process.env.HANA_B2B_ACCOUNT_INFO_URL || '';
  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    transactionPath: process.env.HANA_B2B_TRANSACTION_PATH || '/hbk/api/hbk-service/v1/b2b/transactions',
    balancePath: process.env.HANA_B2B_BALANCE_PATH || '/hbk/api/hbk-service/v1/b2b/balance',
    authorizationToken: process.env.HANA_B2B_AUTHORIZATION_TOKEN || process.env.HANA_B2B_API_KEY || '',
    entrCd: process.env.HANA_B2B_ENTR_CD || process.env.HANA_B2B_ORG_CODE || '',
    appKey: process.env.HANA_B2B_APP_KEY || '',
    clientIp: process.env.HANA_B2B_CLIENT_IP || '127.0.0.1',
    encryptedAccountNo: process.env.HANA_B2B_ENC_ACC_NO || process.env.HANA_B2B_ACCOUNT_NUMBER || '',
    currencyCode: process.env.HANA_B2B_CUR_CD || 'KRW',
    lookbackDays: Number(process.env.HANA_B2B_LOOKBACK_DAYS || 7),
  };
}

function validateHanaConfig(config) {
  const missing = [];
  if (!config.baseUrl) missing.push('HANA_B2B_BASE_URL');
  if (!config.authorizationToken) missing.push('HANA_B2B_AUTHORIZATION_TOKEN');
  if (!config.entrCd) missing.push('HANA_B2B_ENTR_CD');
  if (!config.appKey) missing.push('HANA_B2B_APP_KEY');
  if (!config.encryptedAccountNo) missing.push('HANA_B2B_ENC_ACC_NO');
  return missing;
}

function dateToYmd(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

function hanaHeaders(config) {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json',
    Authorization: config.authorizationToken,
    ENTR_CD: config.entrCd,
    APP_KEY: config.appKey,
  };
}

function dataHeader(config) {
  return {
    CNTY_CD: 'kr',
    ENTR_CD: config.entrCd,
    CLNT_IP_ADDR: config.clientIp,
  };
}

async function hanaPost(url, body, config) {
  const response = await fetch(url, {
    method: 'POST',
    headers: hanaHeaders(config),
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, payload?.dataBody?.RES_MSG || payload?.message || '하나은행 API 호출에 실패했습니다.', 'HANA_API_FAILED');
  }

  const gatewayCode = payload?.dataHeader?.GW_RSLT_CD;
  const responseCode = payload?.dataBody?.RSP_CD;
  if (gatewayCode && gatewayCode !== '1200') {
    throw new ApiError(502, payload?.dataHeader?.GW_RSLT_MSG || '하나은행 게이트웨이 오류입니다.', 'HANA_GATEWAY_FAILED');
  }
  if (responseCode && responseCode !== '0000') {
    throw new ApiError(502, payload?.dataBody?.RES_MSG || '하나은행 서비스 응답 오류입니다.', 'HANA_SERVICE_FAILED');
  }

  return payload;
}

async function fetchHanaTransactions(config) {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(toDate.getDate() - config.lookbackDays);

  return hanaPost(
    `${config.baseUrl}${config.transactionPath}`,
    {
      dataHeader: dataHeader(config),
      dataBody: {
        INQ_ST_DT: dateToYmd(fromDate),
        INQ_END_DT: dateToYmd(toDate),
        NEXT_TRSC_YN: '',
        WDRW_DT: '',
        INQ_REQ_NCNT: Number(process.env.HANA_B2B_INQ_REQ_NCNT || 0),
        ENC_ACC_NO: config.encryptedAccountNo,
        TRSC_SPEC_SRL_NO: Number(process.env.HANA_B2B_TRSC_SPEC_SRL_NO || 0),
        TRSC_DETAIL_SRL_NO: Number(process.env.HANA_B2B_TRSC_DETAIL_SRL_NO || 0),
        CUR_CD: config.currencyCode,
        REC_NCNT: Number(process.env.HANA_B2B_REC_NCNT || 1),
      },
    },
    config
  );
}

async function fetchHanaBalance(config) {
  return hanaPost(
    `${config.baseUrl}${config.balancePath}`,
    {
      dataHeader: dataHeader(config),
      dataBody: {
        ENC_ACC_NO: config.encryptedAccountNo,
        CUR_CD: config.currencyCode,
      },
    },
    config
  );
}

async function saveHanaTransactions(connection, accountNumber, payload) {
  const body = payload?.dataBody || {};
  const records = Array.isArray(body.REC) ? body.REC : [];

  for (const record of records) {
    await connection.query(
      `INSERT INTO hana_b2b_transactions (
        account_number, transaction_date, transaction_time, balance_change_code,
        transaction_amount, outline, branch_name, after_balance, currency_code,
        spec_serial_no, detail_serial_no, raw_json, fetched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), NOW())
      ON DUPLICATE KEY UPDATE
        balance_change_code = VALUES(balance_change_code),
        branch_name = VALUES(branch_name),
        raw_json = VALUES(raw_json),
        fetched_at = NOW()`,
      [
        accountNumber,
        record.TRSC_DT || '',
        record.TRSC_TM || '',
        record.BAL_CHANGE_CD || '',
        toNumber(record.TRSC_AMT),
        record.OUTLINE || '',
        record.DSTRB_CENTR_NM || '',
        toNumber(record.AFTR_TRSC_AMT),
        record.CUR_CD || 'KRW',
        body.TRSC_SPEC_SRL_NO || null,
        body.TRSC_DETAIL_SRL_NO || null,
        JSON.stringify(record),
      ]
    );
  }

  return records.length;
}

async function saveHanaBalance(connection, accountNumber, payload) {
  const body = payload?.dataBody || {};
  await connection.query(
    `INSERT INTO hana_b2b_balances (
      account_number, current_balance, payable_amount, uncleared_check_amount,
      payment_stop_amount, send_date, send_time, raw_json, fetched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), NOW())
    ON DUPLICATE KEY UPDATE
      current_balance = VALUES(current_balance),
      payable_amount = VALUES(payable_amount),
      uncleared_check_amount = VALUES(uncleared_check_amount),
      payment_stop_amount = VALUES(payment_stop_amount),
      send_date = VALUES(send_date),
      send_time = VALUES(send_time),
      raw_json = VALUES(raw_json),
      fetched_at = NOW()`,
    [
      accountNumber,
      toNumber(body.CRNT_BAL),
      toNumber(body.PAY_AVAIL_AMT),
      toNumber(body.UNCL_CHK_AMT),
      toNumber(body.PAY_STOP_AMT),
      body.SND_YMD || null,
      body.SND_HMS || null,
      JSON.stringify(body),
    ]
  );
}

async function loadHanaData() {
  const [transactions] = await pool.query(
    `SELECT id,
            account_number AS accountNumber,
            transaction_date AS transactionDate,
            transaction_time AS transactionTime,
            balance_change_code AS balanceChangeCode,
            transaction_amount AS amount,
            outline,
            branch_name AS branchName,
            after_balance AS balance,
            currency_code AS currencyCode,
            fetched_at AS fetchedAt
       FROM hana_b2b_transactions
      ORDER BY transaction_date DESC, transaction_time DESC, id DESC
      LIMIT 300`
  );

  const [balances] = await pool.query(
    `SELECT account_number AS accountNumber,
            current_balance AS currentBalance,
            payable_amount AS payableAmount,
            uncleared_check_amount AS unclearedCheckAmount,
            payment_stop_amount AS paymentStopAmount,
            send_date AS sendDate,
            send_time AS sendTime,
            fetched_at AS fetchedAt
       FROM hana_b2b_balances
      ORDER BY fetched_at DESC`
  );

  return { transactions, balances };
}

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, bank_name AS bankName, account_number AS accountNumber,
            account_holder AS accountHolder, account_name AS accountName,
            memo, is_active AS isActive, created_at AS createdAt
       FROM company_bank_accounts
      ORDER BY id DESC`
  );

  ok(res, { items: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { bankName, accountNumber, accountHolder, accountName, memo } = req.body;

  if (!bankName || !accountNumber || !accountHolder) {
    throw new ApiError(400, '은행명, 계좌번호, 예금주는 필수입니다.', 'BANK_ACCOUNT_REQUIRED');
  }

  const [result] = await pool.query(
    `INSERT INTO company_bank_accounts (
      bank_name, account_number, account_holder, account_name, memo
    ) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      bank_name = VALUES(bank_name),
      account_holder = VALUES(account_holder),
      account_name = VALUES(account_name),
      memo = VALUES(memo),
      is_active = 1`,
    [bankName, accountNumber, accountHolder, accountName || null, memo || null]
  );

  let id = result.insertId;
  if (!id) {
    const [[account]] = await pool.query('SELECT id FROM company_bank_accounts WHERE account_number = ?', [accountNumber]);
    id = account.id;
  }

  created(res, { id });
}));

router.post('/hana-b2b/refresh', asyncHandler(async (req, res) => {
  const now = Date.now();
  const force = req.body?.force === true;
  const elapsed = now - lastHanaRefreshAt;
  const config = hanaConfig();
  const missing = validateHanaConfig(config);

  if (!force && lastHanaRefreshAt && elapsed < HANA_REFRESH_COOLDOWN_MS) {
    const data = await loadHanaData();
    ok(res, {
      ...data,
      status: 'COOLDOWN',
      message: `안정성을 위해 ${Math.ceil((HANA_REFRESH_COOLDOWN_MS - elapsed) / 1000)}초 후 다시 조회해주세요.`,
      fetchedAt: lastHanaRefreshAt,
      cooldownMs: HANA_REFRESH_COOLDOWN_MS,
      retryAfterMs: HANA_REFRESH_COOLDOWN_MS - elapsed,
      cached: true,
    });
    return;
  }

  if (missing.length) {
    const data = await loadHanaData();
    ok(res, {
      ...data,
      status: 'CONFIG_REQUIRED',
      message: `하나은행 B2B API 설정이 필요합니다: ${missing.join(', ')}`,
      fetchedAt: lastHanaRefreshAt,
      cooldownMs: HANA_REFRESH_COOLDOWN_MS,
      retryAfterMs: 0,
      cached: true,
    });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [transactionPayload, balancePayload] = await Promise.all([
      fetchHanaTransactions(config),
      fetchHanaBalance(config),
    ]);
    const savedCount = await saveHanaTransactions(connection, config.encryptedAccountNo, transactionPayload);
    await saveHanaBalance(connection, config.encryptedAccountNo, balancePayload);
    await connection.commit();
    lastHanaRefreshAt = now;

    const data = await loadHanaData();
    ok(res, {
      ...data,
      status: 'OK',
      message: `하나은행 거래내역 ${savedCount}건과 잔액을 조회했습니다.`,
      fetchedAt: now,
      cooldownMs: HANA_REFRESH_COOLDOWN_MS,
      retryAfterMs: 0,
      cached: false,
    });
  } catch (error) {
    await connection.rollback();
    const data = await loadHanaData();
    ok(res, {
      ...data,
      status: 'ERROR',
      message: error.message || '하나은행 거래내역 조회 중 오류가 발생했습니다.',
      fetchedAt: lastHanaRefreshAt,
      cooldownMs: HANA_REFRESH_COOLDOWN_MS,
      retryAfterMs: HANA_REFRESH_COOLDOWN_MS,
      cached: true,
    });
  } finally {
    connection.release();
  }
}));

router.get('/hana-b2b/transactions', asyncHandler(async (req, res) => {
  const data = await loadHanaData();
  ok(res, {
    ...data,
    status: data.transactions.length || data.balances.length ? 'OK' : 'EMPTY',
    message: data.transactions.length || data.balances.length ? '저장된 하나은행 조회 내역입니다.' : '저장된 하나은행 조회 내역이 없습니다.',
    fetchedAt: lastHanaRefreshAt,
    cooldownMs: HANA_REFRESH_COOLDOWN_MS,
    retryAfterMs: Math.max(HANA_REFRESH_COOLDOWN_MS - (Date.now() - lastHanaRefreshAt), 0),
    cached: true,
  });
}));

module.exports = router;
