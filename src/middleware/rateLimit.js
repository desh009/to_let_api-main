import rateLimit from 'express-rate-limit';

// OTP endpoints send real email/SMS (real money and can be used to harass
// people), so they get a tight limit per IP on top of the per-identifier
// cooldown already enforced in the route handlers.
export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests from this device. Please try again later.' },
});

// Login/password endpoints get a looser but still real limit to slow down
// credential stuffing / brute force.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts from this device. Please try again later.' },
});
