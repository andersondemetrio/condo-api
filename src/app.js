require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const ApiError = require('./utils/ApiError');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota raiz - Evita erro 404 ao abrir a URL da Vercel
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Agenda Condomínio API está online!',
    env: process.env.NODE_ENV 
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/reservations', require('./routes/reservations.routes'));
app.use('/api/holidays', require('./routes/holidays.routes'));
app.use('/api/condo-items', require('./routes/condo-items.routes'));
app.use('/api/checkout-forms', require('./routes/checkout-forms.routes'));

// 404 Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Rota ${req.method} ${req.path} nao encontrada`));
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Erro interno do servidor';

  if (!err.isOperational) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors?.length ? { errors: err.errors } : {}),
    ...(process.env.NODE_ENV === 'development' && !err.isOperational ? { stack: err.stack } : {}),
  });
});

module.exports = app;