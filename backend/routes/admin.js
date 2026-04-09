const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// --- [신규] Cloudinary 및 Storage 설정 ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'leepresso',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    public_id: (req, file) => `${Date.now()}_${file.originalname.split('.')[0]}`
  },
});

const upload = multer({ storage });
const SECRET_KEY = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

/* ---------------------------------------------------------
   [인증 로직 무력화] 모든 요청 프리패스
--------------------------------------------------------- */
const verifyToken = (req, res, next) => {
  next(); 
};

/* ---------------------------------------------------------
   로그인 / 로그아웃 / 관리자 정보
--------------------------------------------------------- */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [results] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    if (results.length === 0) return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });

    const user = results[0];
    const storedPassword = user.password ? String(user.password).trim() : "";

    if (user.is_active !== 1) {
      return res.status(403).json({ message: '승인이 필요한 계정입니다.' });
    }

    let match = false;
    if (storedPassword.startsWith('$2')) {
      match = await bcrypt.compare(password, storedPassword);
    } else {
      match = password === storedPassword;
      if (match) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
      }
    }

    if (!match) {
      res.clearCookie('admin_token', { path: '/' });
      return res.status(401).json({ message: '비밀번호 불일치' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 8,
      path: '/',
    });

    res.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  res.json({ success: true, user: req.user || { role: 'admin' } });
});

// ⭐ 수정 포인트: 프론트에서 filename 대신 path를 쓰도록 명확히 반환
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      message: '파일이 전송되지 않았습니다.',
    });
  }
  res.json({ 
    success: true, 
    filename: req.file.path, // 프론트가 filename을 써도 Cloudinary URL이 가도록 수정
    path: req.file.path 
  });
});

/* ---------------------------------------------------------
   팝업 관리 API (popups)
--------------------------------------------------------- */
router.get('/popups', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT idx, title, image_url, link_url, priority, is_active, 
        DATE_FORMAT(start_date, '%Y-%m-%d %H:%i:%s') as start_date, 
        DATE_FORMAT(end_date, '%Y-%m-%d %H:%i:%s') as end_date, 
        created_at,
        image_url AS image_full_url 
      FROM popups ORDER BY priority DESC, idx DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/popups', async (req, res) => {
  const { title, image_url, link_url, priority, is_active, start_date, end_date } = req.body;
  try {
    if (!title || !image_url) return res.status(400).json({ success: false, message: '제목과 이미지는 필수입니다.' });
    const sDate = start_date ? start_date.replace('T', ' ') : null;
    const eDate = end_date ? end_date.replace('T', ' ') : null;
    await pool.query(
      `INSERT INTO popups (title, image_url, link_url, priority, is_active, start_date, end_date, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, image_url, link_url || '', Number(priority) || 0, is_active ?? 1, sDate, eDate]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/popups/:idx', async (req, res) => {
  const { idx } = req.params;
  const { title, image_url, link_url, priority, is_active, start_date, end_date } = req.body;
  try {
    const sDate = start_date ? start_date.replace('T', ' ') : null;
    const eDate = end_date ? end_date.replace('T', ' ') : null;
    await pool.query(
      `UPDATE popups SET title=?, image_url=?, link_url=?, priority=?, is_active=?, start_date=?, end_date=? WHERE idx=?`,
      [title, image_url, link_url || '', Number(priority) || 0, is_active ?? 1, sDate, eDate, idx]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/popups/:idx', async (req, res) => {
  try {
    await pool.query('DELETE FROM popups WHERE idx = ?', [req.params.idx]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.patch('/popups/:idx/active', async (req, res) => {
  const { idx } = req.params;
  const { is_active } = req.body;
  try {
    await pool.query('UPDATE popups SET is_active = ? WHERE idx = ?', [Number(is_active), Number(idx)]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

/* ---------------------------------------------------------
   카페 메뉴 관리 API (cafe_menu)
--------------------------------------------------------- */
router.get('/menu', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT idx, type, name, eng_name, description, price,
        thumbnail_url AS thumbnail_url,
        is_active FROM cafe_menu WHERE category = "menu" ORDER BY sort_order ASC, created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

router.post('/menu', async (req, res) => {
  const { type, name, eng_name, description, price, thumbnail_url, is_active } = req.body;
  try {
    await pool.query(
      `INSERT INTO cafe_menu (category, type, name, eng_name, description, price, thumbnail_url, is_active)
       VALUES (?,?,?,?,?,?,?,?)`,
      ['menu', type, name, eng_name, description, Number(price) || 0, thumbnail_url || "", is_active ?? 1]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/menu/:idx', async (req, res) => {
  const { idx } = req.params;
  const { type, name, eng_name, description, price, thumbnail_url, is_active } = req.body;
  try {
    await pool.query(
      `UPDATE cafe_menu SET type=?, name=?, eng_name=?, description=?, price=?, thumbnail_url=?, is_active=?, updated_at=NOW() WHERE idx=?`,
      [type, name, eng_name, description, Number(price) || 0, thumbnail_url || "", is_active ?? 1, idx]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/menu/:idx', async (req, res) => {
  const { idx } = req.params;
  try {
    await pool.query('DELETE FROM cafe_menu WHERE idx = ?', [idx]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

/* ---------------------------------------------------------
   매장관리 API (store_list)
--------------------------------------------------------- */
router.get('/stores', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT idx, store_name, address, phone, hours, lat, lng, thumbnail_url, 
      thumbnail_url AS thumbnail_full_url, 
      is_active, created_at FROM store_list ORDER BY idx ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/stores', async (req, res) => {
  const { store_name, address, phone, hours, lat, lng, thumbnail_url, is_active } = req.body;
  try {
    const numLat = isNaN(parseFloat(lat)) ? null : parseFloat(lat);
    const numLng = isNaN(parseFloat(lng)) ? null : parseFloat(lng);
    await pool.query(
      `INSERT INTO store_list (store_name, address, phone, hours, lat, lng, thumbnail_url, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [store_name, address, phone || '', hours || '', numLat, numLng, thumbnail_url || '', is_active ?? 1]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/stores/:idx', async (req, res) => {
  const { idx } = req.params;
  const { store_name, address, phone, hours, lat, lng, thumbnail_url, is_active } = req.body;
  try {
    const numLat = isNaN(parseFloat(lat)) ? null : parseFloat(lat);
    const numLng = isNaN(parseFloat(lng)) ? null : parseFloat(lng);
    await pool.query(
      `UPDATE store_list SET store_name = ?, address = ?, phone = ?, hours = ?, lat = ?, lng = ?, thumbnail_url = ?, is_active = ? WHERE idx = ?`,
      [store_name, address, phone, hours, numLat, numLng, thumbnail_url || '', is_active ?? 1, idx]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/stores/:idx', async (req, res) => {
  try {
    await pool.query('DELETE FROM store_list WHERE idx = ?', [req.params.idx]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

/* ---------------------------------------------------------
   게시판 통합 관리 (Notice, Event, VOC)
--------------------------------------------------------- */
router.get('/board/:type', async (req, res) => {
  const { type } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM board WHERE type = ? ORDER BY is_notice DESC, created_at DESC", 
      [type]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/board', upload.single('file'), async (req, res) => {
  const { category, type, title, content, thumbnail_url, is_notice, is_private } = req.body;
  try {
    let fileName = null, fileUrl = null, fileSize = null, fileMime = null;
    if (req.file) {
      fileName = req.file.originalname;
      fileUrl = req.file.path; // Cloudinary 전체 URL
      fileSize = req.file.size;
      fileMime = req.file.mimetype;
    }
    const query = `
      INSERT INTO board (
        category, type, title, content, thumbnail_url, 
        is_notice, is_private, file_name, file_url, file_size, file_mime, created_at
      ) VALUES ('community', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [type || 'notice', title, content, thumbnail_url || '', Number(is_notice) || 0, Number(is_private) || 0, fileName, fileUrl, fileSize, fileMime];
    await pool.query(query, params);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/board/:idx', upload.single('file'), async (req, res) => {
  const { idx } = req.params;
  const { title, content, is_notice, is_private, thumbnail_url, type, answer, is_answered, keep_existing_file } = req.body;
  try {
    let updateFileFields = "";
    let fileParams = [];
    if (req.file) {
      updateFileFields = `, file_name=?, file_url=?, file_size=?, file_mime=?`;
      fileParams = [req.file.originalname, req.file.path, req.file.size, req.file.mimetype];
    } else if (keep_existing_file === 'false') {
      updateFileFields = `, file_name=NULL, file_url=NULL, file_size=NULL, file_mime=NULL`;
    }
    const query = `
      UPDATE board SET 
        title = IFNULL(?, title), 
        content = IFNULL(?, content), 
        type = IFNULL(?, type),
        is_notice = IFNULL(?, is_notice), 
        is_private = IFNULL(?, is_private), 
        thumbnail_url = IFNULL(?, thumbnail_url), 
        answer = IFNULL(?, answer), 
        is_answered = IFNULL(?, is_answered)
        ${updateFileFields},
        updated_at = NOW() 
      WHERE idx = ?
    `;
    const params = [title || null, content || null, type || null, is_notice, is_private, thumbnail_url || null, answer || null, is_answered, ...fileParams, idx];
    await pool.query(query, params);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.delete('/board/:idx', async (req, res) => {
  try {
    await pool.query("DELETE FROM board WHERE idx = ?", [req.params.idx]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

/* ---------------------------------------------------------
   창업 문의 (franchise_inquiries)
--------------------------------------------------------- */
router.get('/franchise', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM franchise_inquiries ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/franchise/:id', async (req, res) => {
  try {
    await pool.query("UPDATE franchise_inquiries SET status = ?, updated_at = NOW() WHERE id = ?", [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/franchise/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM franchise_inquiries WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

/* ---------------------------------------------------------
   시스템 환경설정 (site_settings)
--------------------------------------------------------- */
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM site_settings WHERE id = 1");
    res.json({ success: true, data: rows[0] || {} });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/settings', async (req, res) => {
  const { site_name, site_logo, is_maintenance, footer_info } = req.body;
  try {
    await pool.query(
      "UPDATE site_settings SET site_name=?, site_logo=?, is_maintenance=?, footer_info=? WHERE id = 1",
      [site_name, site_logo, Number(is_maintenance), footer_info]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/register', async (req, res) => {
  const { username, password, email, nickname, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, password, email, nickname, role, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())",
      [username, hashedPassword, email, nickname, role || 'admin']
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

/* ---------------------------------------------------------
   시스템 통계 및 인프라 관리 API
--------------------------------------------------------- */
router.get('/analytics/visitors', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
        COUNT(DISTINCT session_id) AS visitors,
        COUNT(*) AS pv
      FROM visitor_logs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY date
      ORDER BY date ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.get('/infra/status', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT *, DATEDIFF(expiry_date, CURDATE()) as d_day 
      FROM infra_status 
      ORDER BY id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/infra/status/:id', async (req, res) => {
  const { id } = req.params;
  const { usage_percent, status, expiry_date } = req.body;
  try {
    await pool.query(
      `UPDATE infra_status SET usage_percent = ?, status = ?, expiry_date = ?, last_checked = NOW() WHERE id = ?`,
      [usage_percent, status, expiry_date, id]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.get('/dashboard/stats', async (req, res) => {
  try {
    const [[{ f_count }]] = await pool.query("SELECT COUNT(*) as f_count FROM franchise_inquiries WHERE status = 'RECEIVED'").catch(()=>[[{f_count:0}]]);
    const [[{ e_count }]] = await pool.query("SELECT COUNT(*) as e_count FROM board WHERE type = 'event'").catch(()=>[[{e_count:0}]]);
    const [[{ v_count }]] = await pool.query("SELECT COUNT(*) as v_count FROM board WHERE type = 'voc' AND is_answered = 0").catch(()=>[[{v_count:0}]]);
    const [[{ today_uv }]] = await pool.query("SELECT COUNT(DISTINCT session_id) as today_uv FROM visitor_logs WHERE DATE(created_at) = CURDATE()").catch(()=>[[{today_uv:0}]]);
    const [[{ domain_dday }]] = await pool.query("SELECT DATEDIFF(expiry_date, CURDATE()) as domain_dday FROM infra_status WHERE service_name = 'Main-Domain' LIMIT 1").catch(()=>[[{domain_dday:0}]]);
    const [recent] = await pool.query("SELECT customer_name, hope_region, created_at FROM franchise_inquiries ORDER BY created_at DESC LIMIT 5").catch(()=>[[]]);

    res.json({
      success: true,
      data: {
        counts: { 
          franchise: f_count, 
          event: e_count, 
          voc: v_count, 
          today_visitors: today_uv, 
          domain_dday: domain_dday 
        },
        recentFranchise: recent
      }
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;