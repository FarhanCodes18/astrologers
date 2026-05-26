// =====================================================
// AstroGuide - Contact Route
// POST /api/contact
// Handles contact form submissions
// =====================================================

'use strict';

const express = require('express');
const router  = express.Router();

// ---- In-Memory Store (Replace with DB in production) ----
// In production, save to MongoDB, MySQL, or any database
const contactMessages = [];

// =====================================================
// VALIDATION HELPER
// =====================================================

/**
 * Validates contact form fields
 * @param {Object} data - Request body data
 * @returns {{ isValid: boolean, errors: Object }}
 */
function validateContactForm(data) {
  const errors = {};
  const { name, phone, message } = data;

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.trim().length > 100) {
    errors.name = 'Name must not exceed 100 characters.';
  }

  // Phone validation
  if (!phone || typeof phone !== 'string') {
    errors.phone = 'Phone number is required.';
  } else if (!/^[+]?[\d\s\-]{10,15}$/.test(phone.trim())) {
    errors.phone = 'Enter a valid phone number (10-15 digits).';
  }

  // Message validation
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  } else if (message.trim().length > 2000) {
    errors.message = 'Message must not exceed 2000 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// =====================================================
// POST /api/contact
// =====================================================

/**
 * @route   POST /api/contact
 * @desc    Receive contact form data and store it
 * @access  Public
 *
 * Request Body:
 *   { name: string, phone: string, message: string }
 *
 * Response:
 *   200: { success: true, message: string, id: number }
 *   400: { success: false, message: string, errors: Object }
 *   500: { success: false, message: string }
 */
router.post('/', async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    // ---- Input Validation ----
    const { isValid, errors } = validateContactForm({ name, phone, message });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check the fields.',
        errors,
      });
    }

    // ---- Sanitize Input ----
    const sanitized = {
      name:      name.trim(),
      phone:     phone.trim(),
      message:   message.trim(),
      createdAt: new Date().toISOString(),
      id:        contactMessages.length + 1,
    };

    // ---- Store Data ----
    // In production: await ContactModel.create(sanitized);
    contactMessages.push(sanitized);

    // ---- Log Submission ----
    console.log(`📞 New Contact Message #${sanitized.id}`);
    console.log(`   Name:    ${sanitized.name}`);
    console.log(`   Phone:   ${sanitized.phone}`);
    console.log(`   Message: ${sanitized.message.substring(0, 80)}...`);

    // ---- Optional: Send email notification ----
    // await sendEmailNotification({
    //   to: process.env.ASTROLOGER_EMAIL,
    //   subject: `New Contact: ${sanitized.name}`,
    //   body: `Name: ${sanitized.name}\nPhone: ${sanitized.phone}\nMessage: ${sanitized.message}`
    // });

    // ---- Success Response ----
    return res.status(200).json({
      success: true,
      message: 'Your message has been received. We will contact you soon!',
      id: sanitized.id,
    });

  } catch (error) {
    console.error('❌ Contact route error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
});

// =====================================================
// GET /api/contact — List all messages (Admin only)
// Protect this route with authentication in production!
// =====================================================

/**
 * @route   GET /api/contact
 * @desc    Retrieve all contact messages (for admin)
 * @access  Protected (add auth middleware in production)
 */
router.get('/', (req, res) => {
  // TODO: Add authentication middleware before deployment
  // Example: if (!req.headers.authorization) return res.status(401).json({ ... });

  res.status(200).json({
    success: true,
    count: contactMessages.length,
    data: contactMessages,
  });
});

module.exports = router;
