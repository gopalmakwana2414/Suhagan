import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  sendEmailOTP,
  verifyEmailOTP,
  sendMobileOTP,
  verifyMobileOTP,
} from "../controllers/authController";
import { protect, AuthRequest } from "../middlewares/auth";
import { authLimiter, otpSendLimiter, otpVerifyLimiter } from "../middlewares/rateLimiter";

const router = express.Router();

// Public Routes (rate-limited against brute-force attacks)
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

// OTP routes
router.post("/send-email-otp", otpSendLimiter, sendEmailOTP);
router.post("/verify-email-otp", otpVerifyLimiter, verifyEmailOTP);
router.post("/send-mobile-otp", otpSendLimiter, sendMobileOTP);
router.post("/verify-mobile-otp", otpVerifyLimiter, verifyMobileOTP);


// Password reset — rate-limited to stop email/token brute-forcing
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);

// Protected Route
router.get("/profile", protect, (req: AuthRequest, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;
