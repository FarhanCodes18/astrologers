// =====================================================
// AstroGuide - Receipt Route
// POST /api/receipt/generate     → Generate a receipt after payment
// GET  /api/receipt/:receiptId   → Retrieve a receipt by ID
// =====================================================

'use strict';

const express = require('express');
const router  = express.Router();

// =====================================================
// IN-MEMORY RECEIPT STORE
// Replace with DB persistence in production
// =====================================================
const receipts = [];

// =====================================================
// HELPER — Generate unique Receipt Number
// Format: RCP-YYYYMMDD-XXXXXX
// =====================================================
function generateReceiptNumber() {
  const now    = new Date();
  const date   = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `RCP-${date}-${random}`;
}

// =====================================================
// HELPER — Format currency to Indian Rupees
// =====================================================
function formatCurrency(amountInPaise) {
  const rupees = amountInPaise / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

// =====================================================
// HELPER — Format date to readable string
// =====================================================
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    });
  } catch {
    return dateStr;
  }
}

// =====================================================
// POST /api/receipt/generate
// =====================================================

/**
 * @route   POST /api/receipt/generate
 * @desc    Generate a complete payment receipt
 * @access  Public (called after successful payment verification)
 *
 * Body:
 *   {
 *     bookingId, paymentId, orderId, plan, amount,
 *     fullName, mobile, email, address,
 *     consultationDate, timeSlot, consultationType, notes
 *   }
 *
 * Response:
 *   200 → { success: true, receiptId, receiptNumber, receipt }
 *   400 → { success: false, message }
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      bookingId,
      paymentId,
      orderId,
      plan,
      amount,          // amount in paise
      fullName,
      mobile,
      email,
      address,
      consultationDate,
      timeSlot,
      consultationType,
      notes,
    } = req.body;

    // ---- Basic validation ----
    if (!paymentId || !bookingId || !fullName || !plan || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for receipt generation.',
      });
    }

    // ---- Generate unique receipt identifiers ----
    const receiptId     = `RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const receiptNumber = generateReceiptNumber();
    const issuedAt      = new Date().toISOString();

    // ---- Build complete receipt record ----
    const receipt = {
      receiptId,
      receiptNumber,
      issuedAt,

      // Payment info
      paymentId:          paymentId   || '—',
      orderId:            orderId     || '—',
      bookingId:          bookingId   || '—',
      paymentStatus:      'Successful',
      transactionDate:    formatDate(issuedAt),

      // Customer info
      customerName:       fullName?.trim()     || '—',
      mobile:             mobile?.trim()       || '—',
      email:              email?.trim()        || '—',
      address:            address?.trim()      || '—',

      // Booking info
      plan,
      consultationType:   consultationType    || '—',
      consultationDate:   formatDate(consultationDate),
      consultationDateRaw: consultationDate,
      timeSlot:           timeSlot            || '—',
      notes:              notes               || '',

      // Amount
      amountPaise:        amount,
      amountFormatted:    formatCurrency(amount),
    };

    // ---- Store receipt ----
    receipts.push(receipt);

    console.log(`🧾 Receipt Generated: ${receiptNumber}`);
    console.log(`   Booking: ${bookingId} | Payment: ${paymentId}`);
    console.log(`   Customer: ${receipt.customerName} | Amount: ${receipt.amountFormatted}`);

    return res.status(200).json({
      success: true,
      receiptId,
      receiptNumber,
      receipt,
      message: 'Receipt generated successfully.',
    });

  } catch (error) {
    console.error('❌ Receipt generation error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Receipt generation failed. Please contact support.',
    });
  }
});

// =====================================================
// GET /api/receipt/:receiptId
// =====================================================

/**
 * @route   GET /api/receipt/:receiptId
 * @desc    Retrieve a receipt by its ID
 * @access  Public
 *
 * Response:
 *   200 → { success: true, receipt }
 *   404 → { success: false, message }
 */
router.get('/:receiptId', (req, res) => {
  const { receiptId } = req.params;

  const receipt = receipts.find(r => r.receiptId === receiptId);

  if (!receipt) {
    return res.status(404).json({
      success: false,
      message: `Receipt with ID "${receiptId}" not found.`,
    });
  }

  return res.status(200).json({ success: true, receipt });
});

// =====================================================
// GET /api/receipt — List all receipts (Admin only)
// TODO: Protect with authentication middleware
// =====================================================
router.get('/', (req, res) => {
  const totalRevenue = receipts.reduce((sum, r) => sum + (r.amountPaise || 0), 0);

  return res.status(200).json({
    success: true,
    count:   receipts.length,
    revenue: formatCurrency(totalRevenue),
    data:    receipts,
  });
});

module.exports         = router;
module.exports.store   = receipts; // Export store for cross-route access
