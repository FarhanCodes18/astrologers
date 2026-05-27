// =====================================================
// AstroGuide - Payment Route (Updated)
// Razorpay Payment Integration
//
// Routes:
//   POST /api/payment/create-order  → Create Razorpay order
//   POST /api/payment/verify        → Verify payment + confirm booking + generate receipt
// =====================================================

'use strict';

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();

// ---- Razorpay SDK ----
let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (e) {
  console.warn('⚠️  Razorpay package not installed. Run: npm install razorpay');
}

// ---- Initialize Razorpay Instance ----
// Add your Razorpay Key ID and Secret Key here (in .env file)
let razorpayInstance = null;

if (
  Razorpay &&
  process.env.RAZORPAY_KEY_ID    &&
  process.env.RAZORPAY_KEY_ID    !== 'rzp_test_YourKeyIDHere' &&
  process.env.RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_KEY_SECRET !== 'YourRazorpaySecretKeyHere'
) {
  razorpayInstance = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,     // Add your Razorpay Key ID Here
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Add your Razorpay Secret Key Here
  });
  console.log('✅ Razorpay initialized successfully');
} else {
  console.warn('⚠️  Razorpay keys not configured. Operating in DEMO mode.');
  console.warn('   → Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
}

// ---- Cross-route data access ----
// Lazy-require to avoid circular dependency at startup
function getBookingStore()  { return require('./booking').store; }
function getReceiptRouter() { return require('./receipt');       }

// ---- Allowed plans + server-side amount verification ----
const PLAN_AMOUNTS = {
  'Basic Consultation':                          19900,   // ₹199
  'Detailed Kundli Reading':                     49900,   // ₹499
  'Premium Consultation':                        99900,   // ₹999
  'Single Question Consultation':                49900,   // ₹499
  'Online Full Kundli Consultation':             110000,  // ₹1100
  'Offline Consultation':                        210000,  // ₹2100
  'KP Astrology Course':                         1400000, // ₹14000
  'Ancient Mystical Protocols & Divine Yantras': 500000,  // ₹5000
  'Online Vastu Consultation':                   250000,  // ₹2500
  'Offline Vastu Visit':                         700000,  // ₹7000
  'Nadi Jyotish Consultation':                   2100000, // ₹21000
  'Name Numerology':                             210000,  // ₹2100
  'Tarot Card Reading':                          49900,   // ₹499
};

// ---- In-memory orders store ----
const orders = [];

// =====================================================
// POST /api/payment/create-order
// =====================================================

/**
 * @route   POST /api/payment/create-order
 * @desc    Create a Razorpay order for a booking
 * @access  Public
 *
 * Body: { amount, plan, bookingId }
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, plan, bookingId } = req.body;

    // ---- Validate plan + amount ----
    if (!plan || !PLAN_AMOUNTS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan.' });
    }
    if (!amount || typeof amount !== 'number' || amount !== PLAN_AMOUNTS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch. Please refresh and try again.',
      });
    }
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    // ---- DEMO MODE ----
    if (!razorpayInstance) {
      const demoOrderId = `order_DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      orders.push({
        orderId:   demoOrderId,
        bookingId,
        plan,
        amount,
        status:    'demo',
        createdAt: new Date().toISOString(),
      });

      console.log(`🎭 DEMO Order: ${demoOrderId} | Booking: ${bookingId} | ₹${amount / 100}`);

      return res.status(200).json({
        success:  true,
        orderId:  demoOrderId,
        amount,
        currency: 'INR',
        keyId:    process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',   // Add your Razorpay Key ID Here
        mode:     'demo',
        bookingId,
      });
    }

    // ---- LIVE MODE — Create real Razorpay order ----
    const razorpayOrder = await razorpayInstance.orders.create({
      amount,
      currency: 'INR',
      receipt:  `bkg_${bookingId}`,
      notes:    { plan, bookingId, source: 'AstroGuide' },
    });

    orders.push({
      orderId:         razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      bookingId,
      plan,
      amount:          razorpayOrder.amount,
      status:          'created',
      createdAt:       new Date().toISOString(),
    });

    console.log(`💳 Razorpay Order: ${razorpayOrder.id} | Booking: ${bookingId}`);

    return res.status(200).json({
      success:  true,
      orderId:  razorpayOrder.id,
      amount:   razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,   // Add your Razorpay Key ID Here
      bookingId,
    });

  } catch (error) {
    console.error('❌ Create order error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to create order. Please retry.' });
  }
});

// =====================================================
// POST /api/payment/verify
// =====================================================

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay signature, confirm booking, generate receipt
 * @access  Public
 *
 * Body:
 *   {
 *     razorpay_order_id, razorpay_payment_id, razorpay_signature,
 *     bookingId, plan, amount,
 *     // Booking details for receipt generation:
 *     fullName, mobile, email, address,
 *     consultationDate, timeSlot, consultationType, notes
 *   }
 */
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      plan,
      amount,
      // Customer/booking data for receipt
      fullName,
      mobile,
      email,
      address,
      consultationDate,
      timeSlot,
      consultationType,
      notes,
    } = req.body;

    // ---- Validate required payment fields ----
    if (!razorpay_payment_id || !bookingId) {
      return res.status(400).json({
        success:  false,
        verified: false,
        message:  'Missing payment fields.',
      });
    }

    // ---- DEMO MODE — Skip signature verification ----
    if (!razorpayInstance || (razorpay_order_id && razorpay_order_id.includes('DEMO'))) {
      return await finalizePayment(res, {
        razorpay_order_id,
        razorpay_payment_id,
        bookingId, plan, amount,
        fullName, mobile, email, address,
        consultationDate, timeSlot, consultationType, notes,
        isDemoMode: true,
      });
    }

    // ---- LIVE MODE — Verify Razorpay HMAC signature ----
    // Signature = HMAC-SHA256(orderId + "|" + paymentId, secretKey)
    // Add your Razorpay Secret Key Here (used for signature verification)
    const body              = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET) // Add your Razorpay Secret Key Here
      .update(body)
      .digest('hex');

    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(razorpay_signature, 'hex')
      );
    } catch {
      isValid = false;
    }

    if (!isValid) {
      console.warn(`⚠️  Invalid signature for order: ${razorpay_order_id}`);
      return res.status(400).json({
        success: false, verified: false,
        message: 'Payment verification failed. Please contact support.',
      });
    }

    // ---- Signature valid — finalize payment ----
    return await finalizePayment(res, {
      razorpay_order_id,
      razorpay_payment_id,
      bookingId, plan, amount,
      fullName, mobile, email, address,
      consultationDate, timeSlot, consultationType, notes,
      isDemoMode: false,
    });

  } catch (error) {
    console.error('❌ Payment verify error:', error.message);
    return res.status(500).json({
      success: false, verified: false,
      message: 'Verification error. Please contact support.',
    });
  }
});

// =====================================================
// HELPER — Finalize payment (confirm booking + receipt)
// =====================================================
async function finalizePayment(res, data) {
  const {
    razorpay_order_id, razorpay_payment_id,
    bookingId, plan, amount,
    fullName, mobile, email, address,
    consultationDate, timeSlot, consultationType, notes,
    isDemoMode,
  } = data;

  try {
    // ---- Generate receipt via receipt route handler ----
    const receiptNumber = generateReceiptNum();
    const receiptId     = `RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const now           = new Date().toISOString();

    const receipt = {
      receiptId,
      receiptNumber,
      issuedAt:           now,
      paymentId:          razorpay_payment_id,
      orderId:            razorpay_order_id || '—',
      bookingId,
      paymentStatus:      'Successful',
      transactionDate:    formatReadableDate(now),
      customerName:       fullName    || '—',
      mobile:             mobile      || '—',
      email:              email       || '—',
      address:            address     || '—',
      plan,
      consultationType:   consultationType || '—',
      consultationDate:   formatReadableDate(consultationDate),
      consultationDateRaw: consultationDate,
      timeSlot:           timeSlot    || '—',
      notes:              notes       || '',
      amountPaise:        amount,
      amountFormatted:    `₹${(amount / 100).toLocaleString('en-IN')}`,
      mode:               isDemoMode ? 'demo' : 'live',
    };

    // ---- Update booking status ----
    const bookings = getBookingStore();
    const booking  = bookings.find(b => b.bookingId === bookingId);
    if (booking) {
      booking.status      = 'confirmed';
      booking.paymentId   = razorpay_payment_id;
      booking.orderId     = razorpay_order_id || null;
      booking.receiptId   = receiptId;
      booking.confirmedAt = now;
    }

    // ---- Update order status ----
    const order = orders.find(o => o.bookingId === bookingId);
    if (order) {
      order.status    = isDemoMode ? 'paid_demo' : 'paid';
      order.paymentId = razorpay_payment_id;
      order.paidAt    = now;
    }

    // ---- Store receipt in receipt route ----
    try {
      const receiptModule = getReceiptRouter();
      if (receiptModule.store) {
        receiptModule.store.push(receipt);
      }
    } catch (e) {
      console.warn('Could not push to receipt store:', e.message);
    }

    console.log(`✅ Payment Verified ${isDemoMode ? '[DEMO]' : '[LIVE]'}: ${razorpay_payment_id}`);
    console.log(`   Receipt: ${receiptNumber} | Booking: ${bookingId}`);

    // Simulate sending receipt directly to customer's WhatsApp
    sendWhatsAppReceiptNotification(receipt);

    return res.status(200).json({
      success:   true,
      verified:  true,
      receipt,
      message:   'Payment Successful! Our astrologer will contact you soon.',
    });

  } catch (innerError) {
    console.error('❌ Finalize payment error:', innerError.message);
    // Still return success if payment was verified
    return res.status(200).json({
      success:  true,
      verified: true,
      message:  'Payment Successful! Our astrologer will contact you soon.',
      receipt:  { receiptNumber: 'Pending', paymentId: razorpay_payment_id },
    });
  }
}

// ---- Local helpers ----
function generateReceiptNum() {
  const date   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `RCP-${date}-${random}`;
}

function formatReadableDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return dateStr; }
}

// ---- Admin: list all orders ----
router.get('/orders', (req, res) => {
  res.status(200).json({ success: true, count: orders.length, data: orders });
});

// ---- Simulated WhatsApp Receipt Notification ----
function sendWhatsAppReceiptNotification(receipt) {
  const customerMobile = receipt.mobile || '—';
  const message = `
🔮 *ASTROGUIDE CONSULTATION RECEIPT* 🔮
---------------------------------------
*Receipt No:* ${receipt.receiptNumber}
*Transaction ID:* ${receipt.paymentId}
*Booking ID:* ${receipt.bookingId}
*Customer:* ${receipt.customerName}
*Mobile:* ${receipt.mobile}
*Plan:* ${receipt.plan}
*Amount Paid:* ${receipt.amountFormatted}
*Booking Date:* ${receipt.transactionDate}
*Session Date:* ${receipt.consultationDate}
*Time Slot:* ${receipt.timeSlot}
*Status:* ✅ Payment Successful
---------------------------------------
_Thank you for choosing AstroGuide! Our astrologer will contact you soon on your registered number._
  `.trim();

  console.log('\n💬 ==========================================================');
  console.log(`💬  [WHATSAPP SERVICE] Receipt sent directly to ${customerMobile}`);
  console.log('💬 ==========================================================');
  console.log(message);
  console.log('💬 ==========================================================\n');

  // In production, integrate WhatsApp API (e.g. Twilio WhatsApp API):
  //
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  // client.messages.create({
  //   from: 'whatsapp:+14155238886', // Your business WhatsApp number
  //   to: `whatsapp:${customerMobile.startsWith('+') ? customerMobile : '+91' + customerMobile}`,
  //   body: message
  // }).then(msg => console.log(`[Twilio WhatsApp] Message Sent: ${msg.sid}`))
  //   .catch(err => console.error('[Twilio WhatsApp Error]:', err.message));
}

module.exports = router;
