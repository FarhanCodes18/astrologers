// =====================================================
// AstroGuide - Backend Server
// Full Final Replace Code
// =====================================================

'use strict';

// =====================================================
// IMPORTS
// =====================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// =====================================================
// ENV
// =====================================================

dotenv.config();

// =====================================================
// ROUTES
// =====================================================

const contactRoutes = require('./routes/contact');
const kundliRoutes = require('./routes/kundli');
const paymentRoutes = require('./routes/payment');
const bookingRoutes = require('./routes/booking');
const receiptRoutes = require('./routes/receipt');

// =====================================================
// APP INIT
// =====================================================

const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// CORS
// =====================================================

app.use(cors({
  origin: [
    'https://nadijyotish.online',
    'https://www.nadijyotish.online'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json({
  limit: '10mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// =====================================================
// SECURITY HEADERS
// =====================================================

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// =====================================================
// LOGGER
// =====================================================

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );
  next();
});

// =====================================================
// ROOT ROUTE
// =====================================================

app.get('/', (req, res) => {
  res.send('🚀 AstroGuide Backend Running Successfully');
});

// =====================================================
// HEALTH ROUTE
// =====================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🔮 AstroGuide API Running',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// API ROUTES
// =====================================================

app.use('/api/contact', contactRoutes);

app.use('/api/kundli', kundliRoutes);

app.use('/api/payment', paymentRoutes);

app.use('/api/booking', bookingRoutes);

app.use('/api/receipt', receiptRoutes);

// =====================================================
// STATIC FRONTEND (OPTIONAL)
// =====================================================

const frontendPath = path.join(__dirname, '../frontend');

app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error('Server Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

  console.log('');
  console.log('========================================');
  console.log('🚀 AstroGuide Backend Started');
  console.log('========================================');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log(`📞 Contact API Ready`);
  console.log(`🔮 Kundli API Ready`);
  console.log(`💳 Payment API Ready`);
  console.log(`📅 Booking API Ready`);
  console.log(`🧾 Receipt API Ready`);
  console.log('========================================');
  console.log('');

});

// =====================================================
// EXPORT
// =====================================================

module.exports = app;