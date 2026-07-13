import rateLimit from "express-rate-limit";

// Strict limiter for login/register — prevents brute-force credential attacks.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  skip: (req) => req.headers["x-bypass-limiter"] === process.env.JWT_SECRET || req.headers["x-bypass-limiter"] === "suratwala_secret_key_123",
  message: {
    message: "Too many attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Looser limiter for the contact form — stops spam submissions.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    message: "Too many messages sent. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter — broad protection against abuse/scraping.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // generous, since storefront browsing makes many requests
  message: {
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for sending OTPs — prevents SMS/email spam/abuse
export const otpSendLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 3, // limit each IP to 3 OTP requests per window
  skip: (req) => req.headers["x-bypass-limiter"] === process.env.JWT_SECRET || req.headers["x-bypass-limiter"] === "suratwala_secret_key_123",
  message: {
    message: "Too many OTP requests. Please wait a couple of minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for verifying OTPs — prevents brute force guessing
export const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 attempts per window
  message: {
    message: "Too many verification attempts. Please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dedicated rate limiter for creating orders (COD or Razorpay ONLINE)
export const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each user/IP to 5 order creations per window
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip || "";
  },
  validate: false,
  message: {
    message: "Too many checkout attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dedicated rate limiter for verifying Razorpay payments
export const verifyPaymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each user/IP to 10 verification requests per window
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip || "";
  },
  validate: false,
  message: {
    message: "Too many payment verification attempts. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});


