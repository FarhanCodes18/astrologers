// =====================================================
// AstroGuide - Kundli Route
// POST /api/kundli
// Handles Free Kundli form submissions
// =====================================================

'use strict';

const express = require('express');
const router  = express.Router();

// ---- In-Memory Store (Replace with DB in production) ----
// In production, save to MongoDB, MySQL, or any database
const kundliRequests = [];

// =====================================================
// VALIDATION HELPER
// =====================================================

/**
 * Validates kundli form fields
 * @param {Object} data - Request body
 * @returns {{ isValid: boolean, errors: Object }}
 */
function validateKundliForm(data) {
  const errors = {};
  const { fullName, dateOfBirth, birthTime, birthPlace, phone } = data;

  // Full Name
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  } else if (fullName.trim().length > 100) {
    errors.fullName = 'Full name must not exceed 100 characters.';
  }

  // Date of Birth
  if (!dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required.';
  } else {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    if (isNaN(dob.getTime())) {
      errors.dateOfBirth = 'Invalid date of birth.';
    } else if (dob >= today) {
      errors.dateOfBirth = 'Date of birth must be in the past.';
    } else if (today.getFullYear() - dob.getFullYear() > 120) {
      errors.dateOfBirth = 'Please enter a valid date of birth.';
    }
  }

  // Birth Time
  if (!birthTime || typeof birthTime !== 'string') {
    errors.birthTime = 'Birth time is required.';
  } else if (!/^\d{2}:\d{2}$/.test(birthTime)) {
    errors.birthTime = 'Invalid birth time format.';
  }

  // Birth Place
  if (!birthPlace || typeof birthPlace !== 'string' || birthPlace.trim().length < 2) {
    errors.birthPlace = 'Birth place must be at least 2 characters.';
  } else if (birthPlace.trim().length > 200) {
    errors.birthPlace = 'Birth place must not exceed 200 characters.';
  }

  // Phone
  if (!phone || typeof phone !== 'string') {
    errors.phone = 'Phone number is required.';
  } else if (!/^[+]?[\d\s\-]{10,15}$/.test(phone.trim())) {
    errors.phone = 'Enter a valid phone number (10-15 digits).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// =====================================================
// HELPER — Calculate approximate age from DOB
// =====================================================
function calculateAge(dateOfBirth) {
  const today = new Date();
  const dob   = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// =====================================================
// POST /api/kundli
// =====================================================

/**
 * @route   POST /api/kundli
 * @desc    Receive free kundli request, store data, trigger processing
 * @access  Public
 *
 * Request Body:
 *   {
 *     fullName:    string,
 *     dateOfBirth: string (YYYY-MM-DD),
 *     birthTime:   string (HH:MM),
 *     birthPlace:  string,
 *     phone:       string
 *   }
 *
 * Response:
 *   200: { success: true, message: string, requestId: string }
 *   400: { success: false, message: string, errors: Object }
 *   500: { success: false, message: string }
 */
router.post('/', async (req, res) => {
  try {
    const { fullName, dateOfBirth, birthTime, birthPlace, phone } = req.body;

    // ---- Input Validation ----
    const { isValid, errors } = validateKundliForm({ fullName, dateOfBirth, birthTime, birthPlace, phone });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields correctly.',
        errors,
      });
    }

    // ---- Generate Request ID ----
    const requestId = `KUN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // ---- Sanitize & Build Record ----
    const kundliRecord = {
      requestId,
      fullName:    fullName.trim(),
      dateOfBirth: dateOfBirth,
      birthTime:   birthTime,
      birthPlace:  birthPlace.trim(),
      phone:       phone.trim(),
      age:         calculateAge(dateOfBirth),
      status:      'pending',       // pending | processing | completed
      createdAt:   new Date().toISOString(),
    };

    // ---- Store Data ----
    // In production: await KundliModel.create(kundliRecord);
    kundliRequests.push(kundliRecord);

    // ---- Log Submission ----
    console.log(`📜 New Kundli Request: ${requestId}`);
    console.log(`   Name:     ${kundliRecord.fullName}`);
    console.log(`   DOB:      ${kundliRecord.dateOfBirth} at ${kundliRecord.birthTime}`);
    console.log(`   Place:    ${kundliRecord.birthPlace}`);
    console.log(`   Phone:    ${kundliRecord.phone}`);

    // ---- Optional: Send WhatsApp/SMS notification to astrologer ----
    // await sendWhatsAppAlert({
    //   to: process.env.ASTROLOGER_PHONE,
    //   message: `New Kundli Request!\nName: ${kundliRecord.fullName}\nPhone: ${kundliRecord.phone}\nDOB: ${kundliRecord.dateOfBirth} ${kundliRecord.birthTime}\nPlace: ${kundliRecord.birthPlace}`
    // });

    // ---- Optional: Send confirmation email/SMS to client ----
    // await sendSMSConfirmation(kundliRecord.phone, requestId);

    // ---- Success Response ----
    return res.status(200).json({
      success: true,
      message: 'Kundli request submitted successfully! Our astrologer will contact you within 24 hours.',
      requestId,
      estimatedDelivery: '24 hours',
    });

  } catch (error) {
    console.error('❌ Kundli route error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again or contact us directly.',
    });
  }
});

// =====================================================
// GET /api/kundli — List all kundli requests (Admin only)
// Protect this route with authentication in production!
// =====================================================

/**
 * @route   GET /api/kundli
 * @desc    Retrieve all kundli requests (for admin)
 * @access  Protected (add auth middleware in production)
 */
router.get('/', (req, res) => {
  // TODO: Add authentication middleware before deployment
  // Example: if (!req.headers.authorization) return res.status(401).json({ ... });

  res.status(200).json({
    success: true,
    count: kundliRequests.length,
    data: kundliRequests,
  });
});

// =====================================================
// GET /api/kundli/:requestId — Get single kundli request
// =====================================================

/**
 * @route   GET /api/kundli/:requestId
 * @desc    Get a specific kundli request by ID
 * @access  Protected
 */
router.get('/:requestId', (req, res) => {
  const { requestId } = req.params;
  const request = kundliRequests.find(r => r.requestId === requestId);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: `Kundli request with ID "${requestId}" not found.`,
    });
  }

  res.status(200).json({
    success: true,
    data: request,
  });
});

module.exports = router;
