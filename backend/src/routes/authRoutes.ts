import express from "express";
import {
  registerUser,
  loginUser,
  getCaptcha,
  sendAdminOtp,
  loginAdmin,
  logoutUser,
  forgotPassword,
  verifyForgotOTP,
  resetPassword,
  sendEmailOTP,
  verifyEmailOTP,
  sendMobileOTP,
  verifyMobileOTP,
  getProfile,
  updateProfile,
  updateProfilePicture,
  changePassword,
  changeEmailSendOTP,
  changeEmailVerify,
  changePhoneSendOTP,
  changePhoneVerify,
} from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";
import { customerOnly } from "../middlewares/customer.js";
import { authLimiter, otpSendLimiter, otpVerifyLimiter } from "../middlewares/rateLimiter.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();

// Public Routes (rate-limited against brute-force attacks)
router.get("/captcha", getCaptcha);
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

// Admin Authentication
router.post("/admin/send-otp", otpSendLimiter, sendAdminOtp);
router.post("/admin/login", authLimiter, loginAdmin);

// OTP routes
router.post("/send-email-otp", otpSendLimiter, sendEmailOTP);
router.post("/verify-email-otp", otpVerifyLimiter, verifyEmailOTP);
router.post("/send-mobile-otp", otpSendLimiter, sendMobileOTP);
router.post("/verify-mobile-otp", otpVerifyLimiter, verifyMobileOTP);

// Password reset — rate-limited to stop email/token brute-forcing
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/verify-forgot-otp", otpVerifyLimiter, verifyForgotOTP);
router.post("/reset-password/:token", authLimiter, resetPassword);

// Protected Routes
router.post("/logout", protect, logoutUser);
router.get("/profile", protect, customerOnly, getProfile);
router.put("/profile", protect, customerOnly, updateProfile);
router.put("/profile-picture", protect, customerOnly, upload.single("profilePic"), updateProfilePicture);
router.put("/change-password", protect, customerOnly, changePassword);

// Email & Phone Change Routes
router.post("/change-email/send-otp", protect, customerOnly, changeEmailSendOTP);
router.put("/change-email/verify", protect, customerOnly, changeEmailVerify);
router.post("/change-phone/send-otp", protect, customerOnly, changePhoneSendOTP);
router.put("/change-phone/verify", protect, customerOnly, changePhoneVerify);

export default router;
