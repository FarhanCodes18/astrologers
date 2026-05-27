/* =====================================================
   AstroGuide - Main JavaScript
   Complete Booking + Payment + Receipt Flow

   SECTION MAP:
   1.  Constants & State
   2.  DOM Ready — Init all modules
   3.  Navbar
   4.  Mobile Menu
   5.  Smooth Scroll
   6.  Active Nav Links
   7.  Scroll Reveal
   8.  Counter Animations
   9.  Form Validation Helpers
   10. Kundli Form
   11. Contact Form
   12. FAQ Accordion
   13. BOOKING MODAL — Core of the new flow
   14. Slot Availability Loader
   15. PAYMENT — Razorpay + Demo mode
   16. RECEIPT — Show, Populate, PDF, Print
   17. Scroll-to-Top Button
   18. Today's Horoscope Date
   19. Toast Notifications
   20. Zodiac Card Interactions
   21. Parallax Effect
   22. Service Card Tilt
   23. Keyboard Navigation
   24. Debounce Helper
   ===================================================== */

'use strict';

/* =====================================================================
   1. CONSTANTS & GLOBAL STATE
   ===================================================================== */

const API_BASE_URL = 'https://astrologers.onrender.com';

// Add your Razorpay Key ID here (matches the one in .env)
const RAZORPAY_KEY_ID = 'rzp_test_YourRazorpayKeyHere';

/** Available consultation time slots */
const TIME_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
];

/** Plan metadata — maps plan name to its display info */
const PLAN_META = {
  'Single Question Consultation':                { icon: '📜', duration: '15 Minute Session', price: 499   },
  'Online Full Kundli Consultation':             { icon: '📜', duration: '45 Minute Session', price: 1100  },
  'Offline Consultation':                        { icon: '📜', duration: '60 Minute Session', price: 2100  },
  'KP Astrology Course':                         { icon: '🎓', duration: '12 Week Course',     price: 14000 },
  'Ancient Mystical Protocols & Divine Yantras': { icon: '🔯', duration: 'Custom energized',   price: 5000  },
  'Online Vastu Consultation':                   { icon: '🏛️', duration: 'Vastu Analysis',     price: 2500  },
  'Offline Vastu Visit':                         { icon: '🏡', duration: 'In-person Visit',    price: 7000  },
  'Nadi Jyotish Consultation':                   { icon: '🔱', duration: 'Palm Leaf Reading',  price: 21000 },
  'Name Numerology':                             { icon: '🔢', duration: 'Numerology Report',  price: 2100  },
  'Tarot Card Reading':                          { icon: '🔮', duration: '2 Questions Tarot',  price: 499   },
  'Face Reading Course':                         { icon: '📖', duration: '6 Week Course',      price: 12000 },
  'Vedic Astrology Course':                      { icon: '🔯', duration: '16 Week Course',     price: 21000 },
  'Bhrigu Nandi Nadi Course':                    { icon: '🪐', duration: '8 Week Course',      price: 14000 },
  'Vedic Numerology Course':                     { icon: '🔢', duration: '6 Week Course',      price: 14000 },
  'Jamakol Prasannam Course':                    { icon: '🏹', duration: '4 Week Course',      price: 9000  },
  'Palmistry Course':                            { icon: '✋', duration: '8 Week Course',      price: 14000 },
  'Meditation Workshop':                         { icon: '🧘', duration: '2 Week Workshop',    price: 2999  },
  'Lama Fera Healing Course':                    { icon: '🏮', duration: '6 Week Course',      price: 15000 },
  'Healing Session':                             { icon: '🙌', duration: '30-45 Min Seating',  price: 500   },
};

/**
 * BOOKING STATE — Shared across functions.
 * Holds the currently active booking data between steps.
 */
let bookingState = {
  plan:           null,  // e.g. 'Basic Consultation'
  amount:         0,     // In paise, e.g. 19900
  payBtn:         null,  // Reference to the clicked "Pay Now" button
  bookingId:      null,  // Set after POST /api/booking/create succeeds
  orderId:        null,  // Set after POST /api/payment/create-order succeeds
  bookedSlots:    [],    // Slots booked on selected date (from backend)
  formData:       null,  // Filled booking form data
};

/* =====================================================================
   2. DOM READY — Initialize all modules
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initSmoothScroll();
  initScrollReveal();
  initCounterAnimations();
  initKundliForm();
  initContactForm();
  initFAQAccordion();
  initPaymentButtons();    // Opens booking modal instead of payment directly
  initBookingModal();      // Sets up booking form + slot loader
  initUPIModal();          // Sets up UPI payment modal events
  initReceiptModal();      // Sets up receipt action buttons
  initScrollTopButton();
  initHoroscopeDate();
  initActiveNavLinks();
  initMobileQrPopup();     // Automatically shows WhatsApp QR code popup on mobile once per session
});

/* =====================================================================
   3. NAVBAR — Sticky scroll effect
   ===================================================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const handleScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* =====================================================================
   4. MOBILE MENU — Hamburger toggle
   ===================================================================== */
function initMobileMenu() {
  const hamburger  = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  });

  mobileMenu.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });

  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }
  });
}

/* =====================================================================
   5. SMOOTH SCROLL
   ===================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href   = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* =====================================================================
   6. ACTIVE NAV LINKS
   ===================================================================== */
function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' }
  );

  sections.forEach(section => observer.observe(section));
}

/* =====================================================================
   7. SCROLL REVEAL
   ===================================================================== */
function initScrollReveal() {
  const revealElements = [
    { selector: '.service-card',     cls: 'reveal',       delay: 0.1  },
    { selector: '.problem-card',     cls: 'reveal',       delay: 0.1  },
    { selector: '.plan-card',        cls: 'reveal',       delay: 0.1  },
    { selector: '.zodiac-card',      cls: 'reveal',       delay: 0.05 },
    { selector: '.testimonial-card', cls: 'reveal',       delay: 0.1  },
    { selector: '.stat-card',        cls: 'reveal',       delay: 0.1  },
    { selector: '.step-card',        cls: 'reveal',       delay: 0.15 },
    { selector: '.faq-item',         cls: 'reveal',       delay: 0.08 },
    { selector: '.section-header',   cls: 'reveal',       delay: 0    },
    { selector: '.kundli-content',   cls: 'reveal-left',  delay: 0    },
    { selector: '.kundli-form',      cls: 'reveal-right', delay: 0    },
    { selector: '.contact-info',     cls: 'reveal-left',  delay: 0    },
    { selector: '.contact-form',     cls: 'reveal-right', delay: 0.1  },
  ];

  revealElements.forEach(({ selector, cls, delay }) => {
    document.querySelectorAll(selector).forEach((el, index) => {
      el.classList.add(cls);
      el.style.transitionDelay = `${delay * index}s`;
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });
}

/* =====================================================================
   8. COUNTER ANIMATIONS
   ===================================================================== */
function initCounterAnimations() {
  const statCards = document.querySelectorAll('.stat-card[data-target], .about-stat-item[data-target]');
  if (!statCards.length) return;

  const animateCounter = (el, target, suffix, isDecimal) => {
    const duration  = 2000;
    const steps     = 60;
    const increment = target / steps;
    let current = 0, step = 0;

    const tick = () => {
      step++;
      current = isDecimal
        ? parseFloat((increment * step).toFixed(1))
        : Math.floor(increment * step);

      if (step >= steps) {
        el.textContent = isDecimal
          ? target.toFixed(1) + suffix
          : target.toLocaleString('en-IN') + suffix;
        return;
      }

      el.textContent = isDecimal
        ? current.toFixed(1) + suffix
        : Math.floor(current).toLocaleString('en-IN') + suffix;

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card      = entry.target;
          const target    = parseFloat(card.getAttribute('data-target'));
          const suffix    = card.getAttribute('data-suffix') || '';
          const isDecimal = card.getAttribute('data-decimal') === 'true';
          const numEl     = card.querySelector('.stat-number');

          if (numEl && !card.dataset.animated) {
            card.dataset.animated = 'true';
            animateCounter(numEl, target, suffix, isDecimal);
          }
        }
      });
    },
    { threshold: 0.5 }
  );

  statCards.forEach(card => observer.observe(card));
}

/* =====================================================================
   9. FORM VALIDATION HELPERS
   ===================================================================== */

/**
 * Validates a field and shows/clears inline error.
 * @returns {boolean} isValid
 */
function validateField(inputEl, errorEl, rules) {
  const value = inputEl.value.trim();
  let error   = '';

  if (rules.required && !value) {
    error = 'This field is required.';
  } else if (rules.minLength && value.length < rules.minLength) {
    error = `Minimum ${rules.minLength} characters required.`;
  } else if (rules.pattern && !rules.pattern.test(value)) {
    error = rules.patternMsg || 'Invalid format.';
  }

  if (errorEl) errorEl.textContent = error;
  inputEl.style.borderColor = error ? '#ff6b6b' : '';
  return !error;
}

/** Sets button loading state */
function setButtonLoading(btn, loading, originalText) {
  if (!btn) return;
  if (loading) {
    btn.disabled            = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent         = '⏳ Please wait...';
    btn.style.opacity       = '0.7';
  } else {
    btn.disabled      = false;
    btn.textContent   = originalText || btn.dataset.originalText || 'Submit';
    btn.style.opacity = '';
  }
}

/* =====================================================================
   10. KUNDLI FORM
   ===================================================================== */
function initKundliForm() {
  const form      = document.getElementById('kundliForm');
  if (!form) return;

  const successMsg = document.getElementById('kundli-success');
  const submitBtn  = document.getElementById('kundli-submit-btn');

  const fields = {
    name:  { el: document.getElementById('kundli-name'),  err: document.getElementById('err-kundli-name') },
    dob:   { el: document.getElementById('kundli-dob'),   err: document.getElementById('err-kundli-dob') },
    time:  { el: document.getElementById('kundli-time'),  err: document.getElementById('err-kundli-time') },
    place: { el: document.getElementById('kundli-place'), err: document.getElementById('err-kundli-place') },
    phone: { el: document.getElementById('kundli-phone'), err: document.getElementById('err-kundli-phone') },
  };

  fields.name.el.addEventListener('blur',  () => validateField(fields.name.el,  fields.name.err,  { required: true, minLength: 2 }));
  fields.dob.el.addEventListener('blur',   () => validateField(fields.dob.el,   fields.dob.err,   { required: true }));
  fields.time.el.addEventListener('blur',  () => validateField(fields.time.el,  fields.time.err,  { required: true }));
  fields.place.el.addEventListener('blur', () => validateField(fields.place.el, fields.place.err, { required: true, minLength: 2 }));
  fields.phone.el.addEventListener('blur', () => validateField(fields.phone.el, fields.phone.err, {
    required: true, pattern: /^[+]?[\d\s\-]{10,15}$/, patternMsg: 'Enter a valid phone number.',
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const v1 = validateField(fields.name.el,  fields.name.err,  { required: true, minLength: 2 });
    const v2 = validateField(fields.dob.el,   fields.dob.err,   { required: true });
    const v3 = validateField(fields.time.el,  fields.time.err,  { required: true });
    const v4 = validateField(fields.place.el, fields.place.err, { required: true, minLength: 2 });
    const v5 = validateField(fields.phone.el, fields.phone.err, {
      required: true, pattern: /^[+]?[\d\s\-]{10,15}$/, patternMsg: 'Enter a valid phone number.',
    });

    if (!v1 || !v2 || !v3 || !v4 || !v5) return;

    setButtonLoading(submitBtn, true);
    try {
      const response = await fetch(`${API_BASE_URL}/kundli`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fullName:    fields.name.el.value.trim(),
          dateOfBirth: fields.dob.el.value,
          birthTime:   fields.time.el.value,
          birthPlace:  fields.place.el.value.trim(),
          phone:       fields.phone.el.value.trim(),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        successMsg.removeAttribute('hidden');
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        form.reset();
        setTimeout(() => successMsg.setAttribute('hidden', ''), 10000);
      } else {
        throw new Error(result.message || 'Submission failed.');
      }
    } catch (error) {
      console.error('Kundli form error:', error);
      showToast('❌ Could not submit. Please try again.', 'error');
    } finally {
      setButtonLoading(submitBtn, false, '🔮 Generate Free Kundli');
    }
  });
}

/* =====================================================================
   11. CONTACT FORM
   ===================================================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const successMsg = document.getElementById('contact-success');
  const submitBtn  = document.getElementById('contact-submit-btn');

  const fields = {
    name:    { el: document.getElementById('contact-name'),    err: document.getElementById('err-contact-name') },
    phone:   { el: document.getElementById('contact-phone'),   err: document.getElementById('err-contact-phone') },
    message: { el: document.getElementById('contact-message'), err: document.getElementById('err-contact-message') },
  };

  fields.name.el.addEventListener('blur',    () => validateField(fields.name.el,    fields.name.err,    { required: true, minLength: 2 }));
  fields.phone.el.addEventListener('blur',   () => validateField(fields.phone.el,   fields.phone.err,   { required: true, pattern: /^[+]?[\d\s\-]{10,15}$/, patternMsg: 'Enter a valid phone number.' }));
  fields.message.el.addEventListener('blur', () => validateField(fields.message.el, fields.message.err, { required: true, minLength: 10 }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const v1 = validateField(fields.name.el,    fields.name.err,    { required: true, minLength: 2 });
    const v2 = validateField(fields.phone.el,   fields.phone.err,   { required: true, pattern: /^[+]?[\d\s\-]{10,15}$/, patternMsg: 'Enter a valid phone number.' });
    const v3 = validateField(fields.message.el, fields.message.err, { required: true, minLength: 10 });

    if (!v1 || !v2 || !v3) return;

    setButtonLoading(submitBtn, true);
    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:    fields.name.el.value.trim(),
          phone:   fields.phone.el.value.trim(),
          message: fields.message.el.value.trim(),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        successMsg.removeAttribute('hidden');
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        form.reset();
        setTimeout(() => successMsg.setAttribute('hidden', ''), 10000);
      } else {
        throw new Error(result.message || 'Submission failed.');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      showToast('❌ Could not send message. Please WhatsApp or call us directly.', 'error');
    } finally {
      setButtonLoading(submitBtn, false, '📨 Send Message');
    }
  });
}

/* =====================================================================
   12. FAQ ACCORDION
   ===================================================================== */
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answerId    = questionBtn.getAttribute('aria-controls');
    const answerEl    = document.getElementById(answerId);
    if (!questionBtn || !answerEl) return;

    questionBtn.addEventListener('click', () => {
      const isExpanded = questionBtn.getAttribute('aria-expanded') === 'true';

      faqItems.forEach(other => {
        const otherBtn    = other.querySelector('.faq-question');
        const otherId     = otherBtn?.getAttribute('aria-controls');
        const otherAnswer = otherId ? document.getElementById(otherId) : null;
        if (otherBtn && otherAnswer && other !== item) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherAnswer.setAttribute('hidden', '');
        }
      });

      questionBtn.setAttribute('aria-expanded', String(!isExpanded));
      if (isExpanded) {
        answerEl.setAttribute('hidden', '');
      } else {
        answerEl.removeAttribute('hidden');
        answerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
}

/* =====================================================================
   13. BOOKING MODAL
   NEW FLOW: Pay Now → Booking Form → Payment → Receipt

   Instead of immediately launching Razorpay when "Pay Now" is clicked,
   we first collect customer + consultation details via the booking form.
   Only after successful form submission does Razorpay open.
   ===================================================================== */

/** ---- 13a. initPaymentButtons — Intercept "Pay Now" clicks --------- */
function initPaymentButtons() {
  // SAFETY: ensure the old payment-success div (if present) is always hidden on load
  const oldModal = document.getElementById('payment-success');
  if (oldModal) {
    oldModal.classList.remove('is-active');
    oldModal.setAttribute('hidden', '');
  }

  // Attach click handler to each "Pay Now" button
  document.querySelectorAll('.pay-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan   = btn.getAttribute('data-plan');
      const amount = parseInt(btn.getAttribute('data-amount'), 10);

      // FIX: Open booking form FIRST — never auto-trigger payment
      openBookingModal(plan, amount, btn);
    });
  });
}

/** ---- 13b. openBookingModal — Show the booking form ----------------- */
function openBookingModal(plan, amount, btn) {
  const modal = document.getElementById('bookingModal');
  if (!modal) return;

  // ---- Store current booking context in state ----
  bookingState.plan   = plan;
  bookingState.amount = amount;
  bookingState.payBtn = btn;
  bookingState.bookingId = null;
  bookingState.orderId   = null;
  bookingState.bookedSlots = [];

  // ---- Populate plan summary strip ----
  const meta = PLAN_META[plan] || { icon: '🌙', duration: 'Session', price: amount / 100 };
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setText('planStripIcon',     meta.icon);
  setText('planStripName',     plan);
  setText('planStripDuration', meta.duration);
  setText('planStripPrice',    `₹${meta.price.toLocaleString('en-IN')}`);

  // ---- Reset form ----
  const form = document.getElementById('bookingForm');
  if (form) {
    form.reset();
    form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    form.querySelectorAll('input, textarea, select').forEach(el => el.style.borderColor = '');
    
    // Auto-select dropdown option matching the plan
    const typeSelect = document.getElementById('b-type');
    if (typeSelect) {
      for (let i = 0; i < typeSelect.options.length; i++) {
        if (typeSelect.options[i].value === plan || typeSelect.options[i].text.includes(plan)) {
          typeSelect.selectedIndex = i;
          break;
        }
      }
    }
  }

  // ---- Reset slot grid ----
  document.getElementById('b-slot').value = '';
  resetSlotGrid();

  // ---- Set minimum date to today ----
  const dateInput = document.getElementById('b-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.value = '';
  }

  // ---- Show modal ----
  showModal('bookingModal');
}

/** ---- 13c. initBookingModal — Set up booking form behavior ---------- */
function initBookingModal() {
  // Close button
  document.getElementById('bookingModalClose')?.addEventListener('click', () => {
    closeModal('bookingModal');
    // Restore original "Pay Now" button text if loading
    if (bookingState.payBtn) {
      setButtonLoading(bookingState.payBtn, false, bookingState.payBtn.dataset.originalText);
    }
  });

  // Close on backdrop click
  document.getElementById('bookingModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'bookingModal') {
      closeModal('bookingModal');
    }
  });

  // Date change → load available slots
  document.getElementById('b-date')?.addEventListener('change', (e) => {
    const date = e.target.value;
    if (date) {
      loadAvailableSlots(date);
    } else {
      resetSlotGrid();
    }
  });

  // Booking form submit
  document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitBookingForm();
  });
}

/** ---- 13d. Validate the booking form -------------------------------- */
function validateBookingForm() {
  const fields = {
    name:    { el: document.getElementById('b-name'),    err: document.getElementById('err-b-name') },
    mobile:  { el: document.getElementById('b-mobile'),  err: document.getElementById('err-b-mobile') },
    email:   { el: document.getElementById('b-email'),   err: document.getElementById('err-b-email') },
    type:    { el: document.getElementById('b-type'),    err: document.getElementById('err-b-type') },
    address: { el: document.getElementById('b-address'), err: document.getElementById('err-b-address') },
    date:    { el: document.getElementById('b-date'),    err: document.getElementById('err-b-date') },
    slot:    { el: document.getElementById('b-slot'),    err: document.getElementById('err-b-slot') },
  };

  const isNameValid    = validateField(fields.name.el,    fields.name.err,    { required: true, minLength: 2 });
  const isMobileValid  = validateField(fields.mobile.el,  fields.mobile.err,  { required: true, pattern: /^[+]?[\d\s\-]{10,15}$/, patternMsg: 'Enter a valid mobile number.' });
  const isEmailValid   = validateField(fields.email.el,   fields.email.err,   { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg: 'Enter a valid email address.' });
  const isTypeValid    = validateField(fields.type.el,    fields.type.err,    { required: true });
  const isAddressValid = validateField(fields.address.el, fields.address.err, { required: true, minLength: 5 });
  const isDateValid    = validateField(fields.date.el,    fields.date.err,    { required: true });
  const isSlotValid    = validateField(fields.slot.el,    fields.slot.err,    { required: true });

  // Extra date check — must not be in the past
  if (isDateValid) {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const selected = new Date(fields.date.el.value);
    if (selected < today) {
      fields.date.err.textContent = 'Date cannot be in the past.';
      fields.date.el.style.borderColor = '#ff6b6b';
      return { isValid: false };
    }
  }

  const isValid = isNameValid && isMobileValid && isEmailValid && isTypeValid
               && isAddressValid && isDateValid && isSlotValid;

  if (!isValid) {
    // Focus first error
    const firstError = document.querySelector('#bookingForm [style*="border-color: rgb(255, 107, 107)"]');
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return { isValid, fields };
}

/** ---- 13e. Submit booking form → backend → then open payment -------- */
async function submitBookingForm() {
  const { isValid } = validateBookingForm();
  if (!isValid) return;

  const submitBtn = document.getElementById('bookingSubmitBtn');
  setButtonLoading(submitBtn, true);

  // Collect form data
  const formData = {
    fullName:         document.getElementById('b-name').value.trim(),
    mobile:           document.getElementById('b-mobile').value.trim(),
    email:            document.getElementById('b-email').value.trim(),
    address:          document.getElementById('b-address').value.trim(),
    consultationDate: document.getElementById('b-date').value,
    timeSlot:         document.getElementById('b-slot').value,
    consultationType: document.getElementById('b-type').value,
    notes:            document.getElementById('b-notes').value.trim(),
    plan:             bookingState.plan,
    amount:           bookingState.amount,
  };

  // Store for receipt use
  bookingState.formData = formData;

  try {
    // ---- POST /api/booking/create ----
    const response = await fetch(`${API_BASE_URL}/booking/create`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.status === 409) {
      // Slot was just taken — refresh slots
      showToast(`⚠️ That slot was just booked! Please choose another.`, 'error');
      await loadAvailableSlots(formData.consultationDate);
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || 'Booking failed.');
    }

    bookingState.bookingId = result.bookingId;

    // ---- Close booking modal, proceed to payment ----
    closeModal('bookingModal');
    await initiatePayment(formData);

  } catch (error) {
    console.error('Booking submit error:', error);

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      // Demo mode — backend not running
      closeModal('bookingModal');
      bookingState.bookingId = `BKG-DEMO-${Date.now()}`;
      await initiatePayment(formData);
    } else {
      showToast(`❌ ${error.message}`, 'error');
    }
  } finally {
    setButtonLoading(submitBtn, false, '🔐 Proceed to Secure Payment');
  }
}

/* =====================================================================
   14. SLOT AVAILABILITY LOADER
   Fetches booked slots from backend for a given date and
   renders the slot grid with available/booked states.
   ===================================================================== */

/** Resets the slot grid to the initial "select a date" state */
function resetSlotGrid() {
  const grid     = document.getElementById('slotGrid');
  const infoBox  = document.getElementById('slotInfoBox');
  const infoText = document.getElementById('slotInfoText');

  if (grid) {
    grid.innerHTML = `<div class="slot-loading" id="slotLoading">
      <span>📅</span> Please select a date above to view available slots
    </div>`;
  }

  if (infoBox) {
    infoBox.className = 'slot-info-box';
    if (infoText) infoText.textContent = 'Select a date to see available slots';
  }

  // Clear hidden input and any slot error
  const slotInput = document.getElementById('b-slot');
  if (slotInput) slotInput.value = '';
  const errSlot = document.getElementById('err-b-slot');
  if (errSlot) errSlot.textContent = '';

  bookingState.bookedSlots = [];
}

/**
 * Fetches available slots from backend for a date,
 * then renders the slot grid.
 * Falls back to showing all slots as available if backend is down.
 */
async function loadAvailableSlots(date) {
  const grid    = document.getElementById('slotGrid');
  const infoBox = document.getElementById('slotInfoBox');
  const infoTxt = document.getElementById('slotInfoText');

  if (!grid) return;

  // Show loading state
  grid.innerHTML = `<div class="slot-loading">⏳ Checking availability...</div>`;
  if (infoBox) infoBox.className = 'slot-info-box';
  if (infoTxt) infoTxt.textContent = 'Loading...';

  // Clear selected slot
  const slotInput = document.getElementById('b-slot');
  if (slotInput) slotInput.value = '';

  let bookedSlots = [];

  try {
    const response = await fetch(`${API_BASE_URL}/booking/slots?date=${date}`);
    const data     = await response.json();

    if (response.ok && data.success) {
      bookedSlots = data.bookedSlots || [];
    }
  } catch (err) {
    // Backend not running — show all slots as available
    console.warn('Could not fetch slots (demo mode):', err.message);
  }

  bookingState.bookedSlots = bookedSlots;
  renderSlotGrid(bookedSlots);

  // Update slot info box
  const available = TIME_SLOTS.length - bookedSlots.length;
  if (infoBox && infoTxt) {
    if (available === 0) {
      infoBox.className = 'slot-info-box slots-full';
      infoTxt.textContent = '⛔ All slots fully booked for this date';
    } else if (available <= 2) {
      infoBox.className = 'slot-info-box slots-limited';
      infoTxt.textContent = `⚡ Only ${available} slot${available === 1 ? '' : 's'} left!`;
    } else {
      infoBox.className = 'slot-info-box slots-available';
      infoTxt.textContent = `✅ ${available} of ${TIME_SLOTS.length} slots available`;
    }
  }
}

/**
 * Renders time slot buttons into the #slotGrid.
 * @param {string[]} bookedSlots - Array of already-booked time slots
 */
function renderSlotGrid(bookedSlots = []) {
  const grid = document.getElementById('slotGrid');
  if (!grid) return;

  grid.innerHTML = '';

  TIME_SLOTS.forEach(slot => {
    const isBooked = bookedSlots.includes(slot);
    const btn      = document.createElement('button');
    btn.type       = 'button';
    btn.className  = `slot-btn ${isBooked ? 'slot-booked' : 'slot-available'}`;
    btn.disabled   = isBooked;
    btn.setAttribute('aria-label', `${slot} — ${isBooked ? 'Booked' : 'Available'}`);

    btn.innerHTML = `
      <span>${slot}</span>
      <span class="slot-badge">${isBooked ? 'Booked' : 'Available'}</span>
    `;

    if (!isBooked) {
      btn.addEventListener('click', () => selectSlot(slot, btn));
    }

    grid.appendChild(btn);
  });
}

/**
 * Marks a time slot as selected in the grid and updates the hidden input.
 */
function selectSlot(slot, clickedBtn) {
  // Deselect all other slots
  document.querySelectorAll('.slot-btn.slot-selected').forEach(b => {
    b.classList.remove('slot-selected');
    b.classList.add('slot-available');
    const badge = b.querySelector('.slot-badge');
    if (badge) badge.textContent = 'Available';
  });

  // Select clicked slot
  clickedBtn.classList.remove('slot-available');
  clickedBtn.classList.add('slot-selected');
  const badge = clickedBtn.querySelector('.slot-badge');
  if (badge) badge.textContent = 'Selected ✓';

  // Update hidden input
  const slotInput = document.getElementById('b-slot');
  if (slotInput) slotInput.value = slot;

  // Clear slot error
  const errSlot = document.getElementById('err-b-slot');
  if (errSlot) errSlot.textContent = '';
}

/* =====================================================================
   15. PAYMENT — Razorpay Integration
   ===================================================================== */

async function initiatePayment(formData) {
  const { plan, amount } = bookingState;
  const btn = bookingState.payBtn;
  const originalText = btn?.textContent || 'Pay Now';

  if (btn) setButtonLoading(btn, true);

  try {
    const upiId = '7999464526@ybl';
    const amountRupees = amount / 100;
    const upiLink = `upi://pay?pa=${upiId}&pn=Astronadi&am=${amountRupees}&cu=INR`;

    // Populate UPI Modal details
    const planNameEl = document.getElementById('upi-plan-name');
    const amountValEl = document.getElementById('upi-amount-val');
    const qrCodeImg = document.getElementById('upi-qr-code');
    const launchUpiBtn = document.getElementById('btnLaunchUPI');

    if (planNameEl) planNameEl.textContent = plan;
    if (amountValEl) amountValEl.textContent = `₹${amountRupees.toLocaleString('en-IN')}`;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      if (launchUpiBtn) {
        launchUpiBtn.href = upiLink;
        launchUpiBtn.style.display = 'inline-flex';
      }
      // Auto redirect on mobile device to deep link
      window.location.href = upiLink;
    } else {
      if (qrCodeImg) {
        qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;
      }
    }

    if (btn) setButtonLoading(btn, false, originalText);
    
    // Open the UPI Modal
    showModal('upiModal');

  } catch (error) {
    console.error('Payment initiation error:', error);
    showToast('❌ Failed to initiate UPI payment. Please try again.', 'error');
    if (btn) setButtonLoading(btn, false, originalText);
  }
}

/**
 * Verifies payment with backend.
 * On success → generates receipt → shows receipt modal.
 */
async function verifyPayment(razorpayResponse, formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        razorpay_order_id:   razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature:  razorpayResponse.razorpay_signature,
        bookingId:           bookingState.bookingId,
        plan:                bookingState.plan,
        amount:              bookingState.amount,
        // Pass full booking data for receipt generation
        ...formData,
      }),
    });

    const data = await response.json();

    if (response.ok && data.verified) {
      // Build receipt data combining payment response + booking form data
      const receiptData = {
        receiptNumber:    data.receipt?.receiptNumber || generateLocalReceiptNum(),
        paymentId:        razorpayResponse.razorpay_payment_id || '—',
        orderId:          razorpayResponse.razorpay_order_id   || bookingState.orderId || '—',
        bookingId:        bookingState.bookingId               || '—',
        ...formData,
        amountFormatted:  `₹${(bookingState.amount / 100).toLocaleString('en-IN')}`,
        transactionDate:  formatDate(new Date().toISOString()),
        consultationDate: formatDate(formData.consultationDate),
      };
      showReceipt(receiptData);

      // Auto redirect to WhatsApp with prefilled details
      setTimeout(() => {
        triggerWhatsAppRedirect(formData);
      }, 1000); // 1s delay to let the receipt modal render first smoothly
      
    } else {
      showToast('⚠️ Payment verification failed. Please contact support.', 'error');
    }
  } catch (error) {
    console.error('Payment verify error:', error);
    // Optimistic success — show receipt even if verification call fails
    const receiptData = {
      receiptNumber:    generateLocalReceiptNum(),
      paymentId:        '—',
      orderId:          bookingState.orderId || '—',
      bookingId:        bookingState.bookingId || '—',
      ...formData,
      amountFormatted:  `₹${(bookingState.amount / 100).toLocaleString('en-IN')}`,
      transactionDate:  formatDate(new Date().toISOString()),
      consultationDate: formatDate(formData.consultationDate),
    };
    showReceipt(receiptData);

    // Auto redirect to WhatsApp with prefilled details
    setTimeout(() => {
      triggerWhatsAppRedirect(formData);
    }, 1000); // 1s delay to let the receipt modal render first smoothly
  }
}

/**
 * Automatically opens WhatsApp with prefilled booking details.
 */
function triggerWhatsAppRedirect(formData) {
  const merchantWhatsApp = '917999464526'; // The merchant's WhatsApp number to receive booking details
  
  const amountFormatted = `₹${(bookingState.amount / 100).toLocaleString('en-IN')}`;
  const dateFormatted = formatDate(formData.consultationDate);
  
  const msg = `New Booking / Payment Received\n\n` +
              `Name: ${formData.fullName}\n` +
              `Mobile: ${formData.mobile}\n` +
              `Service / Course: ${bookingState.plan}\n` +
              `Amount: ${amountFormatted}\n` +
              `Date: ${dateFormatted}\n` +
              `Time Slot: ${formData.timeSlot}\n` +
              `Address: ${formData.address}\n` +
              `Payment Status: Successful`;

  const url = `https://wa.me/${merchantWhatsApp}?text=${encodeURIComponent(msg)}`;
  
  // Open in a new tab
  window.open(url, '_blank', 'noopener,noreferrer');
}

/* =====================================================================
   16. RECEIPT — Show, Populate, Download PDF, Print
   ===================================================================== */

/** ---- 16a. initReceiptModal — Bind action buttons ----------------- */
function initReceiptModal() {
  // WhatsApp Share button
  document.getElementById('sendWhatsAppReceiptBtn')?.addEventListener('click', sendWhatsAppReceipt);

  // Download PDF button
  document.getElementById('downloadReceiptBtn')?.addEventListener('click', downloadReceiptAsPDF);

  // Print button
  document.getElementById('printReceiptBtn')?.addEventListener('click', printReceipt);

  // Close button
  document.getElementById('closeReceiptBtn')?.addEventListener('click', () => {
    closeModal('receiptModal');
  });

  // Close on backdrop click
  document.getElementById('receiptModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'receiptModal') {
      closeModal('receiptModal');
    }
  });
}

/** ---- 16b. initUPIModal — Bind UPI modal actions ------------------- */
function initUPIModal() {
  // Close button
  document.getElementById('upiModalClose')?.addEventListener('click', () => {
    closeModal('upiModal');
  });

  // Close on backdrop click
  document.getElementById('upiModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'upiModal') {
      closeModal('upiModal');
    }
  });

  // Copy UPI ID button
  document.getElementById('btnCopyUPI')?.addEventListener('click', () => {
    const upiId = document.getElementById('upi-id-string')?.textContent || '7999464526@ybl';
    navigator.clipboard.writeText(upiId).then(() => {
      showToast('📋 UPI ID copied to clipboard!', 'success');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      showToast('❌ Copy failed. Please type manually.', 'error');
    });
  });

  // Confirm Paid button
  document.getElementById('upiConfirmPaidBtn')?.addEventListener('click', async () => {
    const confirmBtn = document.getElementById('upiConfirmPaidBtn');
    setButtonLoading(confirmBtn, true, 'Confirming...');
    try {
      const mockResponse = {
        razorpay_order_id: `order_UPI_DEMO_${Date.now()}`,
        razorpay_payment_id: `pay_UPI_${Date.now()}`,
        razorpay_signature: 'demo_signature',
      };
      await verifyPayment(mockResponse, bookingState.formData);
      closeModal('upiModal');
    } catch (error) {
      console.error('Verify error:', error);
      showToast('❌ Verification failed. Please try again.', 'error');
    } finally {
      setButtonLoading(confirmBtn, false, '✅ Confirm Payment & Book Slot');
    }
  });
}

/**
 * Opens WhatsApp with the beautifully formatted receipt message.
 */
function sendWhatsAppReceipt() {
  const receiptNo    = document.getElementById('r-receiptNo')?.textContent || '—';
  const paymentId    = document.getElementById('r-paymentId')?.textContent || '—';
  const bookingId    = document.getElementById('r-bookingId')?.textContent || '—';
  const customerName = document.getElementById('r-name')?.textContent || '—';
  const mobile       = document.getElementById('r-mobile')?.textContent || '—';
  const plan         = document.getElementById('r-plan')?.textContent || '—';
  const amount       = document.getElementById('r-amount')?.textContent || '—';
  const txnDate      = document.getElementById('r-txnDate')?.textContent || '—';
  const sessionDate  = document.getElementById('r-consultationDate')?.textContent || '—';
  const timeSlot     = document.getElementById('r-timeSlot')?.textContent || '—';

  const message = `🔮 *ASTRONADI CONSULTATION RECEIPT* 🔮\n` +
                  `---------------------------------------\n` +
                  `*Receipt No:* ${receiptNo}\n` +
                  `*Transaction ID:* ${paymentId}\n` +
                  `*Booking ID:* ${bookingId}\n` +
                  `*Customer:* ${customerName}\n` +
                  `*Mobile:* ${mobile}\n` +
                  `*Plan:* ${plan}\n` +
                  `*Amount Paid:* ${amount}\n` +
                  `*Booking Date:* ${txnDate}\n` +
                  `*Session Date:* ${sessionDate}\n` +
                  `*Time Slot:* ${timeSlot}\n` +
                  `*Status:* ✅ Payment Successful\n` +
                  `---------------------------------------\n` +
                  `_Thank you for choosing Astronadi! Our astrologer will contact you soon on your registered number._`;

  const encodedMessage = encodeURIComponent(message);
  const cleanMobile = mobile.replace(/[^0-9]/g, '');

  // Open WhatsApp with direct number if available, else general contact picker
  const whatsappUrl = cleanMobile 
    ? `https://wa.me/${cleanMobile}?text=${encodedMessage}` 
    : `https://api.whatsapp.com/send?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  showToast('Opening WhatsApp...', 'success');
}

/**
 * Populates and shows the receipt modal.
 * @param {Object} data - Receipt data from backend or generated locally
 */
function showReceipt(data) {
  // Helper to set text content safely
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  };

  // Transaction
  set('r-receiptNo',        data.receiptNumber);
  set('r-paymentId',        data.paymentId);
  set('r-orderId',          data.orderId);
  set('r-bookingId',        data.bookingId);

  // Customer
  set('r-name',             data.fullName);
  set('r-mobile',           data.mobile);
  set('r-email',            data.email);
  set('r-address',          data.address);

  // Consultation
  set('r-plan',             data.plan);
  set('r-consultationType', data.consultationType);
  set('r-consultationDate', data.consultationDate);
  set('r-timeSlot',         data.timeSlot);

  // Payment
  set('r-amount',           data.amountFormatted);
  set('r-txnDate',          data.transactionDate);

  // Show receipt modal
  showModal('receiptModal');
}

/**
 * Downloads the receipt as a PDF using html2pdf.js.
 * The #receiptContent div is converted to a PDF and downloaded.
 */
async function downloadReceiptAsPDF() {
  const element = document.getElementById('receiptContent');
  if (!element) return;

  const btn = document.getElementById('downloadReceiptBtn');
  if (btn) {
    btn.textContent = '⏳ Generating PDF...';
    btn.disabled    = true;
  }

  try {
    // Check if html2pdf is loaded
    if (typeof html2pdf === 'undefined') {
      // Fallback: use print dialog as PDF
      printReceipt();
      return;
    }

    const receiptNo  = document.getElementById('r-receiptNo')?.textContent || 'Receipt';
    const customerName = document.getElementById('r-name')?.textContent || 'Customer';
    const filename   = `Astronadi_Receipt_${receiptNo}.pdf`;

    const opt = {
      margin:       [10, 10, 10, 10],
      filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' },
    };

    await html2pdf().set(opt).from(element).save();
    showToast('✅ Receipt downloaded!', 'success');

  } catch (error) {
    console.error('PDF download error:', error);
    showToast('Could not generate PDF. Trying print instead.', 'info');
    printReceipt();
  } finally {
    if (btn) {
      btn.textContent = '📥 Download PDF';
      btn.disabled    = false;
    }
  }
}

/**
 * Prints the receipt using the browser's native print dialog.
 * The @media print CSS hides all other elements.
 */
function printReceipt() {
  window.print();
}

/* =====================================================================
   MODAL HELPERS — show/hide with class-based visibility
   ===================================================================== */

/** Shows a modal overlay by ID */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.removeAttribute('hidden');
  modal.classList.add('is-active');
  document.body.style.overflow = 'hidden'; // Prevent background scroll
}

/** Hides a modal overlay by ID */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('is-active');
  modal.setAttribute('hidden', '');
  document.body.style.overflow = ''; // Restore scroll
}

/* =====================================================================
   17. SCROLL TO TOP BUTTON
   ===================================================================== */
function initScrollTopButton() {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.removeAttribute('hidden');
    } else {
      btn.setAttribute('hidden', '');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* =====================================================================
   18. TODAY'S HOROSCOPE DATE
   ===================================================================== */
function initHoroscopeDate() {
  const dateEl = document.getElementById('horoscope-date');
  if (!dateEl) return;

  const formatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  dateEl.textContent = `✨ ${formatted} — Daily Cosmic Forecast`;
}

/* =====================================================================
   19. TOAST NOTIFICATIONS
   ===================================================================== */
function showToast(message, type = 'info') {
  document.querySelectorAll('.astro-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'astro-toast';

  const colors = {
    info:    { bg: 'rgba(107, 70, 193, 0.95)', border: 'rgba(107, 70, 193, 0.5)' },
    success: { bg: 'rgba(34, 197, 94, 0.95)',  border: 'rgba(34, 197, 94, 0.5)'  },
    error:   { bg: 'rgba(239, 68, 68, 0.95)',  border: 'rgba(239, 68, 68, 0.5)'  },
  };

  const { bg, border } = colors[type] || colors.info;

  toast.style.cssText = `
    position: fixed; bottom: 100px; left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: ${bg}; border: 1px solid ${border};
    border-radius: 50px; padding: 14px 28px; color: #fff;
    font-size: 0.9rem; font-weight: 500; z-index: 99999;
    backdrop-filter: blur(20px); box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    max-width: 90vw; text-align: center;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); opacity: 0;
  `;

  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity   = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* =====================================================================
   20. ZODIAC CARD INTERACTIONS
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const zodiacCards = document.querySelectorAll('.zodiac-card');

  zodiacCards.forEach(card => {
    card.addEventListener('click', () => {
      const prediction = card.querySelector('.zodiac-prediction')?.textContent;
      const name       = card.querySelector('.zodiac-name')?.textContent;
      if (prediction && name) {
        showToast(`${name}: ${prediction.substring(0, 80)}...`, 'info');
      }
    });
  });

  // Hero content entrance animation
  setTimeout(() => {
    document.querySelectorAll('.hero-content > *').forEach((el, i) => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = `opacity 0.7s ease ${i * 0.12}s, transform 0.7s ease ${i * 0.12}s`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      }));
    });
  }, 100);
});

/* =====================================================================
   21. PARALLAX EFFECT
   ===================================================================== */
window.addEventListener('scroll', () => {
  const heroIllustration = document.querySelector('.hero-illustration');
  const starsLayers      = document.querySelectorAll('.stars');

  if (heroIllustration && window.scrollY < window.innerHeight) {
    heroIllustration.style.transform = `translateY(${window.scrollY * 0.08}px)`;
  }

  starsLayers.forEach((layer, index) => {
    layer.style.transform = `translateY(${window.scrollY * (index + 1) * 0.03}px)`;
  });
}, { passive: true });

/* =====================================================================
   22. SERVICE CARD TILT EFFECT
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const serviceCards = document.querySelectorAll('.service-card, .plan-card');

  serviceCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const centerX = rect.width  / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
});

/* =====================================================================
   23. KEYBOARD NAVIGATION
   ===================================================================== */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close mobile menu
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburger  = document.getElementById('hamburger-btn');
    if (mobileMenu?.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      hamburger?.classList.remove('active');
      hamburger?.setAttribute('aria-expanded', 'false');
    }

    // Close booking modal on Escape
    if (document.getElementById('bookingModal')?.classList.contains('is-active')) {
      closeModal('bookingModal');
    }

    // Close UPI modal on Escape
    if (document.getElementById('upiModal')?.classList.contains('is-active')) {
      closeModal('upiModal');
    }

    // Close receipt modal on Escape
    if (document.getElementById('receiptModal')?.classList.contains('is-active')) {
      closeModal('receiptModal');
    }

    // Close Mobile QR modal on Escape
    if (document.getElementById('mobileQrModal')?.classList.contains('is-active')) {
      closeModal('mobileQrModal');
    }
  }
});

/* =====================================================================
   24. UTILITY HELPERS
   ===================================================================== */

/** Debounce — delays a function call until after wait ms of inactivity */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Formats a date string to a human-readable format.
 * @param {string} dateStr - ISO date string or YYYY-MM-DD
 * @returns {string} e.g. "Tuesday, 3 June 2025"
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generates a local receipt number when backend is unavailable.
 * Format: RCP-YYYYMMDD-XXXXXX
 */
function generateLocalReceiptNum() {
  const date   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `RCP-${date}-${random}`;
}

/**
 * Dynamically updates a service card's book button based on the selected dropdown option.
 * Used for services with multiple pricing tiers (e.g. Kundli Reading, Vastu).
 * 
 * @param {HTMLSelectElement} selectEl - The dropdown select element
 */
function updateServicePrice(selectEl) {
  if (!selectEl) return;
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  if (!selectedOption) return;

  const plan = selectedOption.value;
  const amount = selectedOption.getAttribute('data-amount');
  const price = selectedOption.getAttribute('data-price');

  // Find the pay button in the same card
  const card = selectEl.closest('.service-card');
  const btn = card?.querySelector('.pay-btn');

  if (btn) {
    btn.setAttribute('data-plan', plan);
    btn.setAttribute('data-amount', amount);
    btn.textContent = `✨ Book Now — ₹${price}`;
  }
}

/* =====================================================================
   25. MOBILE QR POPUP MODULE
   ===================================================================== */
function initMobileQrPopup() {
  const modal = document.getElementById('mobileQrModal');
  const closeBtn = document.getElementById('mobileQrClose');
  const bookBtn = document.getElementById('qr-book-btn');
  if (!modal || !closeBtn || !bookBtn) return;

  // Viewport / Screen check — only trigger on screen sizes <= 768px (Mobile/Tablet)
  const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) return;

  // Session check — only show once per browser session
  if (sessionStorage.getItem('nadiQrPopupShown') === 'true') return;

  // Automatically show after a short delay (e.g. 2.5 seconds)
  setTimeout(() => {
    showModal('mobileQrModal');
    sessionStorage.setItem('nadiQrPopupShown', 'true');
  }, 2500);

  // Close handlers
  closeBtn.addEventListener('click', () => {
    closeModal('mobileQrModal');
  });

  modal.addEventListener('click', (e) => {
    if (e.target.id === 'mobileQrModal') {
      closeModal('mobileQrModal');
    }
  });

  // Booking CTA inside popup
  bookBtn.addEventListener('click', () => {
    closeModal('mobileQrModal');
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}
