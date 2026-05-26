// =====================================================
// AstroGuide - Backend Server
// Node.js + Express REST API
// =====================================================

'use strict';

// ---- Core Dependencies ----
const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const path       = require('path');

// ---- Load Environment Variables ----
// Reads .env file and makes variables available via process.env
dotenv.config();

// ---- Route Imports ----
const contactRoutes = require('./routes/contact');
const kundliRoutes  = require('./routes/kundli');
const paymentRoutes = require('./routes/payment');
const bookingRoutes = require('./routes/booking');  // NEW: Booking + slot management
const receiptRoutes = require('./routes/receipt');  // NEW: Receipt generation

// ---- Initialize Express App ----
const app  = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// MIDDLEWARE SETUP
// =====================================================

/**
 * CORS — Allow requests from frontend origin
 * Update 'origin' to your production domain before deploying.
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',  // e.g. 'https://astroguide.in'
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

/**
 * JSON Body Parser — Parse incoming JSON request bodies
 * Limit set to 10kb to prevent payload attacks
 */
app.use(express.json({ limit: '10kb' }));

/**
 * URL Encoded Body Parser — Handle form submissions
 */
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * Request Logger Middleware — Logs all incoming requests
 * (Replace with Morgan or Winston in production)
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

/**
 * Security Headers Middleware — Basic security hardening
 */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// =====================================================
// API ROUTES
// =====================================================

/**
 * Health Check Endpoint
 * GET /api/health
 * Used to verify the server is running
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🔮 AstroGuide API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/**
 * Contact Route  →  POST /api/contact
 * Handles contact form submissions
 */
app.use('/api/contact', contactRoutes);

/**
 * Kundli Route  →  POST /api/kundli
 * Handles free kundli form submissions
 */
app.use('/api/kundli', kundliRoutes);

/**
 * Payment Routes  →  POST /api/payment/create-order
 *                    POST /api/payment/verify
 * Handles Razorpay payment integration
 */
app.use('/api/payment', paymentRoutes);

/**
 * Booking Routes  →  POST /api/booking/create
 *                    GET  /api/booking/slots
 *                    GET  /api/booking/:bookingId
 * Manages consultation bookings and slot availability
 */
app.use('/api/booking', bookingRoutes);

/**
 * Receipt Routes  →  POST /api/receipt/generate
 *                    GET  /api/receipt/:receiptId
 * Generates and retrieves payment receipts
 */
app.use('/api/receipt', receiptRoutes);

// =====================================================
// SERVE STATIC FRONTEND (Optional)
// Uncomment below to serve the frontend from Express
// =====================================================

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// =====================================================
// 404 HANDLER — Catch all unmatched routes
// =====================================================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on AstroGuide API`,
    hint: 'Available: /api/health, /api/contact, /api/kundli, /api/booking, /api/payment, /api/receipt',
  });
});

// =====================================================
// GLOBAL ERROR HANDLER — Catches all unhandled errors
// =====================================================
app.use((err, req, res, next) => {
  console.error('🔴 Unhandled Error:', err.stack || err.message);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack }),
  });
});

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log('');
  console.log('🔮 =============================================');
  console.log('🔮  AstroGuide Backend Server Started');
  console.log('🔮 =============================================');
  console.log(`🌟  Server running at: http://localhost:${PORT}`);
  console.log(`🌙  Health check:      http://localhost:${PORT}/api/health`);
  console.log(`📜  Kundli API:        http://localhost:${PORT}/api/kundli`);
  console.log(`📞  Contact API:       http://localhost:${PORT}/api/contact`);
  console.log(`💳  Payment API:       http://localhost:${PORT}/api/payment`);
  console.log(`📅  Booking API:       http://localhost:${PORT}/api/booking`);
  console.log(`🧾  Receipt API:       http://localhost:${PORT}/api/receipt`);
  console.log(`🔑  Environment:       ${process.env.NODE_ENV || 'development'}`);
  console.log('🔮 =============================================');
  console.log('');
});

module.exports = app; // Export for testing
