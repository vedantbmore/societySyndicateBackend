const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many requests. Please slow down and try again shortly." } },
});

// Stricter limiter for auth endpoints, to blunt password-guessing attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many sign-in attempts. Please try again in a few minutes." } },
});

// Gate scanning is bursty but bounded — a guard scans one visitor at a time.
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many scan attempts. Please wait a moment." } },
});

module.exports = { apiLimiter, authLimiter, verifyLimiter };
