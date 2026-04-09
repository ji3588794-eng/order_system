const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306, // 환경 변수가 없으면 기본 3306

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // SSL 설정: DB_SSL이 'true' 문자열일 때만 활성화 (TiDB 등 클라우드 DB용)
  ssl: process.env.DB_SSL === 'true' 
    ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
      }
    : undefined
});

module.exports = pool;