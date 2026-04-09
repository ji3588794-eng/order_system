const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 파일 업로드 세팅 (Multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });


// [GET] /api/user/popups
router.get('/popups', async (req, res) => {
  try {
    const sql = `
      SELECT idx, title, image_url, link_url 
      FROM popups 
      WHERE is_active = 1 
      ORDER BY priority DESC, idx DESC
      LIMIT 5
    `;
    const [rows] = await pool.query(sql);
    
    // 💡 프론트엔드와 규격을 맞추기 위해 객체로 감싸서 보냅니다.
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ SQL ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// [GET] /api/user/community
router.get('/community', async (req, res) => {
  // 프론트에서 넘어오는 activeTab 값 (notice, event, voc)
  const type = req.query.type || 'notice';
  
  try {
    // is_active 조건이 있다면 추가하는 것이 좋습니다.
    const sql = 'SELECT * FROM board WHERE type = ? ORDER BY idx DESC';
    const [rows] = await pool.query(sql, [type]);
    
    // 디버깅용 로그: 어떤 타입으로 몇 건이 조회되었는지 출력
    console.log(`[Community] Fetch Type: ${type}, Found: ${rows.length} posts`);
    
    res.json(rows);
  } catch (error) { 
    console.error('❌ Community Fetch Error:', error.message);
    res.status(500).json({ error: error.message }); 
  }
});

// [POST] /api/user/franchise (이미지 컬럼명 반영 버전)
router.post('/franchise', async (req, res) => {
  const { 
    customer_name, 
    phone_number, 
    email, 
    hope_region, 
    has_store, 
    inquiry_channels, 
    inquiry_content,
    user_agent 
  } = req.body;

  const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const sql = `
      INSERT INTO franchise_inquiries 
      (customer_name, phone_number, email, hope_region, has_store, inquiry_channels, inquiry_content, ip_address, user_agent, status, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED', NOW(), NOW())
    `;

    const [result] = await pool.query(sql, [
      customer_name, 
      phone_number, 
      email || null, 
      hope_region || null, 
      has_store || 'N', 
      inquiry_channels || null, 
      inquiry_content || null,
      ip_address,
      user_agent || null
    ]);

    // ⭐️ 이 부분이 핵심입니다. 
    // DB 입력 후 반드시 'json' 형태로 응답을 마쳐야 프론트가 에러로 안 빠집니다.
    return res.status(200).json({ 
      success: true, 
      message: '정상적으로 접수되었습니다.' 
    });
    
  } catch (error) {
    console.error('❌ DB 저장 중 에러 발생:', error.message);
    
    // 에러 발생 시에도 JSON 응답을 보내줘야 프론트가 "통신 오류"라고 안 뜹니다.
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        error: '데이터베이스 저장 실패' 
      });
    }
  }
});

// [GET] /api/user/community/:id (상세보기)
router.get('/community/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM board WHERE idx = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    
    // 조회수 증가 (실패해도 본문은 보여줘야 하므로 catch 처리)
    await pool.query('UPDATE board SET view_count = view_count + 1 WHERE idx = ?', [id]).catch(() => {});
    
    res.json(rows[0]);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

// [POST] /api/user/community/write
router.post('/community/write', upload.single('image'), async (req, res) => {
  const { type, title, content, is_private, password } = req.body;
  const thumbnail_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const sql = `
      INSERT INTO board 
      (category, type, title, content, thumbnail_url, password, is_private, view_count, is_active, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, NOW())
    `;
    const [result] = await pool.query(sql, [type, type, title, content, thumbnail_url, password || null, is_private || 0]);
    res.json({ success: true, idx: result.insertId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// [GET] /api/user/menus
router.get('/menus', async (req, res) => {
  const { type } = req.query;

  try {
    let query = `
      SELECT
        idx,
        type,
        name,
        eng_name,
        description,
        thumbnail_url,
        price
      FROM cafe_menu
      WHERE is_active = 1
    `;

    const params = [];

    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY sort_order ASC, idx DESC';

    const [rows] = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('메뉴 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '메뉴 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// [GET] /api/user/stores
router.get('/stores', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM store_list ORDER BY idx ASC');
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;