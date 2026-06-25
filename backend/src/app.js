const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { cors: corsConfig } = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: corsConfig.origin, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 백엔드는 API만 담당합니다.
// 화면은 frontend(localhost:3000)에서 열고, 이 서버(localhost:3001)는 데이터만 제공합니다.
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
