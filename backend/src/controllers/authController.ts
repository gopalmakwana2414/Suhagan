import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Otp } from "../models/Otp";
import { generateToken } from "../utils/jwt";
import { sendWelcomeEmail, sendResetPasswordEmail, sendOTPEmail } from "../services/emailService";
import smsService from "../services/smsService";

// Helper validators
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateIndianMobile = (mobile: string) => {
  const mobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

const normalizeMobile = (mobile: string) => {
  const cleaned = mobile.replace(/\D/g, ""); // keep only digits
  if (cleaned.length === 10) return cleaned;
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned.slice(2);
  if (cleaned.length === 11 && cleaned.startsWith("0")) return cleaned.slice(1);
  return cleaned;
};

const validatePasswordStrength = (password: string) => {
  if (password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

// POST /api/auth/send-email-otp
export const sendEmailOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const emailLower = email.toLowerCase();

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Save/Update in Otp collection (valid for 5 minutes)
    await Otp.deleteMany({ identifier: emailLower });
    await Otp.create({
      identifier: emailLower,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      verified: false,
    });

    // Send the email with local development logging fallback
    try {
      await sendOTPEmail({ to: emailLower, otp });
      console.log(`[Email Service] OTP email successfully sent to ${emailLower}`);
    } catch (err: any) {
      console.warn("SMTP email dispatch failed. Error:", err.message);
      console.log(`\n--- [EMAIL SERVICE DEVELOPER FALLBACK] ---`);
      console.log(`Recipient Email: ${emailLower}`);
      console.log(`Verification Code: ${otp}`);
      console.log(`Expires in: 5 minutes`);
      console.log(`------------------------------------------\n`);
      
      // If we are in production, fail the request; in development, proceed with the console log fallback
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
    }

    res.status(200).json({ success: true, message: "OTP sent successfully to your email." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-email-otp
export const verifyEmailOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const emailLower = email.toLowerCase();

    const otpDoc = await Otp.findOne({
      identifier: emailLower,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      return res.status(400).json({ message: "OTP expired or invalid. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Mark as verified, clear hash, extend TTL to 15 mins for registration window
    otpDoc.verified = true;
    otpDoc.otpHash = "verified"; // invalidate hash to prevent re-use
    otpDoc.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await otpDoc.save();

    res.status(200).json({ success: true, message: "Email verified successfully." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/send-mobile-otp
export const sendMobileOTP = async (req: Request, res: Response) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !validateIndianMobile(mobile)) {
      return res.status(400).json({ message: "Please provide a valid Indian mobile number." });
    }

    const normalizedMobile = normalizeMobile(mobile);

    // Check if user already exists with this mobile number
    const existingUser = await User.findOne({ mobile: normalizedMobile });
    if (existingUser) {
      return res.status(400).json({ message: "User with this mobile number already exists." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Save/Update in Otp collection (valid for 5 minutes)
    await Otp.deleteMany({ identifier: normalizedMobile });
    await Otp.create({
      identifier: normalizedMobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      verified: false,
    });

    // Send mobile SMS
    await smsService.sendMobileOTP({ mobile: normalizedMobile, otp });

    res.status(200).json({ success: true, message: "OTP sent successfully to your mobile number." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-mobile-otp
export const verifyMobileOTP = async (req: Request, res: Response) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile number and OTP are required." });
    }

    const normalizedMobile = normalizeMobile(mobile);

    const otpDoc = await Otp.findOne({
      identifier: normalizedMobile,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      return res.status(400).json({ message: "OTP expired or invalid. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Mark as verified, clear hash, extend TTL to 15 mins for registration window
    otpDoc.verified = true;
    otpDoc.otpHash = "verified"; // invalidate hash to prevent re-use
    otpDoc.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await otpDoc.save();

    res.status(200).json({ success: true, message: "Mobile number verified successfully." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// register
export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      confirmPassword,
      houseNumber,
      street,
      landmark,
      city,
      state,
      country,
      postalCode,
    } = req.body;

    // 1. Enforce mandatory fields
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 characters." });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }
    if (!mobile || !validateIndianMobile(mobile)) {
      return res.status(400).json({ message: "Please provide a valid Indian mobile number." });
    }
    if (!password || !validatePasswordStrength(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    if (!houseNumber || !houseNumber.trim()) {
      return res.status(400).json({ message: "House Number / Flat Number is required." });
    }
    if (!street || !street.trim()) {
      return res.status(400).json({ message: "Street / Area is required." });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ message: "City is required." });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ message: "State is required." });
    }
    if (!country || !country.trim()) {
      return res.status(400).json({ message: "Country is required." });
    }
    if (!postalCode || !postalCode.trim()) {
      return res.status(400).json({ message: "Postal Code / PIN Code is required." });
    }

    const emailLower = email.toLowerCase();
    const normalizedMobile = normalizeMobile(mobile);

    // 2. Reject duplicates
    const existingUserEmail = await User.findOne({ email: emailLower });
    if (existingUserEmail) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    const existingUserMobile = await User.findOne({ mobile: normalizedMobile });
    if (existingUserMobile) {
      return res.status(400).json({ message: "User with this mobile number already exists." });
    }

    // 3. Verify OTP state in DB
    const emailVerifiedDoc = await Otp.findOne({
      identifier: emailLower,
      verified: true,
      expiresAt: { $gt: new Date() },
    });
    if (!emailVerifiedDoc) {
      return res.status(400).json({ message: "Please verify your email." });
    }

    const mobileVerifiedDoc = await Otp.findOne({
      identifier: normalizedMobile,
      verified: true,
      expiresAt: { $gt: new Date() },
    });
    if (!mobileVerifiedDoc) {
      return res.status(400).json({ message: "Please verify your mobile number." });
    }

    // 4. Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const computedAddress = `${houseNumber.trim()}, ${street.trim()}${landmark && landmark.trim() ? `, ${landmark.trim()}` : ""}, ${city.trim()}, ${state.trim()}, ${country.trim()} - ${postalCode.trim()}`;

    const user = await User.create({
      name: name.trim(),
      email: emailLower,
      password: hashedPassword,
      mobile: normalizedMobile,
      emailVerified: true,
      mobileVerified: true,
      houseNumber: houseNumber.trim(),
      street: street.trim(),
      landmark: landmark ? landmark.trim() : "",
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      postalCode: postalCode.trim(),
      address: computedAddress,
    });

    // 5. Cleanup OTP verification states
    await Otp.deleteMany({ identifier: { $in: [emailLower, normalizedMobile] } });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: user.email, customerName: user.name }).catch(
      (err: any) => console.error("Welcome email failed:", err.message)
    );


    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


// login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  },

  token: generateToken(user._id.toString()),
});
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// forgot password — always returns the same message whether or not the
// email exists, so we're not leaking which emails are registered
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const genericResponse = {
      success: true,
      message:
        "If an account exists for that email, a password reset link has been sent.",
    };

    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (!user) {
      // Don't reveal whether the email exists — same response either way.
      return res.status(200).json(genericResponse);
    }

    // only store a hash of the token, same idea as password hashing
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${rawToken}`;

    try {
      await sendResetPasswordEmail({
        to: user.email,
        customerName: user.name,
        resetUrl,
      });
    } catch (emailError: any) {
      // email failed, so clear the token instead of leaving a dead one
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.error("Reset password email failed:", emailError.message);

      return res.status(500).json({
        message: "Failed to send reset email. Please try again later.",
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// reset password — consume the token from the emailed link
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset link. Please request a new one.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
