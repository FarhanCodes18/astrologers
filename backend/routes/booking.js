// =====================================================
// AstroGuide - Booking Route
// POST /api/booking/create       → Create a new booking
// GET  /api/booking/slots        → Get available slots for a date
// GET  /api/booking              → List all bookings (admin)
// =====================================================

'use strict';

const express = require('express');
const router  = express.Router();

// =====================================================
// CONSTANTS
// =====================================================

/** All available time slots for consultation */
const ALL_TIME_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
];

const VALID_PLANS = [
  'Basic Consultation',
  'Detailed Kundli Reading',
  'Premium Consultation',
];

const VALID_CONSULTATION_TYPES = [
  'Kundli Reading',
  'Love & Marriage Astrology',
  'Career Guidance',
  'Vastu Consultation',
  'Daily Horoscope',
  'Name Numerology',
];

// =====================================================
// IN-MEMORY STORE
// Replace with a real database (MongoDB/MySQL) in production
// =====================================================

/** Array of all booking records */
const bookings = [];

/**
 * Tracks booked slots per date.
 * Shape: { 'YYYY-MM-DD': ['09:00 AM - 10:00 AM', ...] }
 */
const bookedSlotsByDate = {};

// =====================================================
// HELPER — Generate unique Booking ID
// =====================================================
function generateBookingId() {
  const ts     = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `BKG-${ts}-${random}`;
}

// =====================================================
// VALIDATION HELPER
// =====================================================
function validateBookingData(data) {
  const errors = {};
  const { fullName, mobile, email, address, consultationDate, timeSlot, plan, consultationType } = data;

  // Full Name
  if (!fullName || fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  // Mobile
  if (!mobile || !/^[+]?[\d\s\-]{10,15}$/.test(mobile.trim())) {
    errors.mobile = 'Enter a valid mobile number (10–15 digits).';
  }

  // Email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  // Address
  if (!address || address.trim().length < 5) {
    errors.address = 'Please enter a complete address.';
  }

  // Consultation Date — must be today or future
  if (!consultationDate) {
    errors.consultationDate = 'Consultation date is required.';
  } else {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const selected = new Date(consultationDate);
    if (isNaN(selected.getTime())) {
      errors.consultationDate = 'Invalid date.';
    } else if (selected < today) {
      errors.consultationDate = 'Consultation date cannot be in the past.';
    }
  }

  // Time Slot
  if (!timeSlot || !ALL_TIME_SLOTS.includes(timeSlot)) {
    errors.timeSlot = 'Please select a valid time slot.';
  }

  // Plan
  if (!plan || !VALID_PLANS.includes(plan)) {
    errors.plan = 'Invalid consultation plan.';
  }

  // Consultation Type
  if (!consultationType || !VALID_CONSULTATION_TYPES.includes(consultationType)) {
    errors.consultationType = 'Please select a valid consultation type.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// =====================================================
// POST /api/booking/create
// =====================================================

/**
 * @route   POST /api/booking/create
 * @desc    Create a new booking after slot availability check
 * @access  Public
 *
 * Body: { fullName, mobile, email, address, consultationDate,
 *          timeSlot, plan, consultationType, notes, amount }
 *
 * Response:
 *   200 → { success: true, bookingId, message }
 *   400 → { success: false, errors }
 *   409 → { success: false, message: 'Slot already booked' }
 */
router.post('/create', async (req, res) => {
  try {
    const {
      fullName, mobile, email, address,
      consultationDate, timeSlot, plan,
      consultationType, notes, amount,
    } = req.body;

    // ---- Validate all required fields ----
    const { isValid, errors } = validateBookingData({
      fullName, mobile, email, address,
      consultationDate, timeSlot, plan, consultationType,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check the fields.',
        errors,
      });
    }

    // ---- Check for double booking (same date + same slot) ----
    const slotsOnDate = bookedSlotsByDate[consultationDate] || [];
    if (slotsOnDate.includes(timeSlot)) {
      return res.status(409).json({
        success:  false,
        message:  `The slot "${timeSlot}" on ${consultationDate} is already booked. Please choose a different slot.`,
        bookedSlot: timeSlot,
      });
    }

    // ---- Generate booking ID ----
    const bookingId = generateBookingId();

    // ---- Build booking record ----
    const booking = {
      bookingId,
      fullName:         fullName.trim(),
      mobile:           mobile.trim(),
      email:            email.trim().toLowerCase(),
      address:          address.trim(),
      consultationDate,
      timeSlot,
      plan,
      consultationType,
      notes:            notes ? notes.trim() : '',
      amount:           amount || 0,
      status:           'pending_payment', // pending_payment | confirmed | cancelled
      paymentId:        null,
      orderId:          null,
      receiptId:        null,
      createdAt:        new Date().toISOString(),
      confirmedAt:      null,
    };

    // ---- Store booking (tentatively — slot reserved pending payment) ----
    // NOTE: In production, implement a booking expiry (e.g., 15 min TTL)
    // so that unpaid slots are released automatically.
    bookings.push(booking);

    // Reserve the slot (prevent double booking during payment window)
    if (!bookedSlotsByDate[consultationDate]) {
      bookedSlotsByDate[consultationDate] = [];
    }
    bookedSlotsByDate[consultationDate].push(timeSlot);

    console.log(`📅 New Booking: ${bookingId} | ${plan} | ${consultationDate} ${timeSlot}`);
    console.log(`   Customer: ${booking.fullName} | ${booking.mobile}`);

    return res.status(200).json({
      success:   true,
      bookingId,
      message:   'Booking slot reserved! Proceed to payment.',
    });

  } catch (error) {
    console.error('❌ Booking create error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Booking failed. Please try again.',
    });
  }
});

// =====================================================
// GET /api/booking/slots?date=YYYY-MM-DD
// =====================================================

/**
 * @route   GET /api/booking/slots
 * @desc    Get available time slots for a given date
 * @access  Public
 *
 * Query:  ?date=YYYY-MM-DD
 *
 * Response:
 *   200 → { success: true, date, allSlots, bookedSlots, availableSlots }
 *   400 → { success: false, message }
 */
router.get('/slots', (req, res) => {
  const { date } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      success: false,
      message: 'Provide a valid date in YYYY-MM-DD format.',
    });
  }

  // Validate date is not in the past
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const selected = new Date(date);
  if (selected < today) {
    return res.status(400).json({
      success: false,
      message: 'Cannot check slots for a past date.',
    });
  }

  const bookedOnDate    = bookedSlotsByDate[date] || [];
  const availableSlots  = ALL_TIME_SLOTS.filter(s => !bookedOnDate.includes(s));

  return res.status(200).json({
    success:        true,
    date,
    allSlots:       ALL_TIME_SLOTS,
    bookedSlots:    bookedOnDate,
    availableSlots,
    totalSlots:     ALL_TIME_SLOTS.length,
    remainingSlots: availableSlots.length,
  });
});

// =====================================================
// PATCH /api/booking/:bookingId/confirm
// Called internally from payment/verify to confirm booking
// =====================================================

/**
 * @route   PATCH /api/booking/:bookingId/confirm
 * @desc    Mark a booking as confirmed after successful payment
 * @access  Internal (called from payment route)
 */
router.patch('/:bookingId/confirm', (req, res) => {
  const { bookingId } = req.params;
  const { paymentId, orderId, receiptId } = req.body;

  const booking = bookings.find(b => b.bookingId === bookingId);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: `Booking ${bookingId} not found.`,
    });
  }

  // Update booking status
  booking.status      = 'confirmed';
  booking.paymentId   = paymentId  || null;
  booking.orderId     = orderId    || null;
  booking.receiptId   = receiptId  || null;
  booking.confirmedAt = new Date().toISOString();

  console.log(`✅ Booking Confirmed: ${bookingId} | Payment: ${paymentId}`);

  return res.status(200).json({
    success: true,
    message: 'Booking confirmed successfully.',
    booking,
  });
});

// =====================================================
// GET /api/booking/:bookingId
// =====================================================

/**
 * @route   GET /api/booking/:bookingId
 * @desc    Get a specific booking by ID
 */
router.get('/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const booking = bookings.find(b => b.bookingId === bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  return res.status(200).json({ success: true, data: booking });
});

// =====================================================
// GET /api/booking — List all bookings (Admin only)
// TODO: Add authentication middleware before deployment
// =====================================================
router.get('/', (req, res) => {
  const summary = {
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending:   bookings.filter(b => b.status === 'pending_payment').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return res.status(200).json({ success: true, summary, data: bookings });
});

// =====================================================
// Export router and in-memory store (for cross-route access)
// =====================================================
module.exports        = router;
module.exports.store  = bookings;        // Used by receipt route
module.exports.slots  = bookedSlotsByDate; // Used by payment route
