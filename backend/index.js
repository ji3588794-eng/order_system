const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
// Render는 자동으로 PORT 변수를 주입하므로 그대로 사용하면 됩니다.
const PORT = process.env.PORT || 3001; 

// 미들웨어 설정
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [
    'https://leepresso.com',
    'https://www.leepresso.com',
    'https://leepresso-project.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우터 연결
const adminRouter = require('./routes/admin');
const userRouter = require('./routes/user');

app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
  console.log(`🌐 Mode: ${process.env.NODE_ENV}`);
});