import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import { Session } from "../models/Session.js";
import { LoginHistory } from "../models/LoginHistory.js";
import { SecurityLog } from "../models/SecurityLog.js";
import { Captcha } from "../models/Captcha.js";
import {
  userLoginSchema,
  adminSendOtpSchema,
  adminLoginSchema,
} from "../validators/authValidator.js";
import { generateToken } from "../utils/jwt.js";
import { parseUserAgent } from "../utils/helpers.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinaryService.js";
import {
  sendWelcomeEmail,
  sendRegistrationOTPEmail,
  sendForgotPasswordOTPEmail,
  sendEmailChangeOTPEmail,
  sendPasswordChangedEmail,
  sendAccountLockedEmail,
  sendPasswordResetSuccessEmail,
  sendAdminLoginOTPEmail,
} from "../services/emailService.js";
import smsService from "../services/smsService.js";

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

const getCountryFromReq = (req: Request) => {
  return String(req.headers["cf-ipcountry"] || req.headers["x-appengine-country"] || "India");
};

// POST /api/auth/send-email-otp
export const sendEmailOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const emailLower = email.toLowerCase();

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // Check existing OTP for resend limits
    let otpDoc = await Otp.findOne({ identifier: emailLower });
    const now = new Date();

    if (otpDoc) {
      // 1. Resend cooldown (60 seconds)
      if (otpDoc.lastResentAt && now.getTime() - otpDoc.lastResentAt.getTime() < 60 * 1000) {
        const timeRemaining = Math.ceil((60 * 1000 - (now.getTime() - otpDoc.lastResentAt.getTime())) / 1000);
        return res.status(429).json({
          message: `Please wait ${timeRemaining} seconds before requesting another OTP.`,
        });
      }

      // 2. Max resend attempts (limit to 3 resends per OTP cycle)
      if (otpDoc.resendAttempts && otpDoc.resendAttempts >= 3) {
        return res.status(429).json({
          message: "Maximum OTP resend attempts exceeded. Please try again after 5 minutes.",
        });
      }

      // Update existing OTP document
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      otpDoc.otpHash = otpHash;
      otpDoc.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
      otpDoc.verified = false;
      otpDoc.verifyAttempts = 0;
      otpDoc.resendAttempts = (otpDoc.resendAttempts || 0) + 1;
      otpDoc.lastResentAt = now;
      await otpDoc.save();

      // Dispatch
      await sendRegistrationOTPEmail({ to: emailLower, otp });
    } else {
      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      await Otp.create({
        identifier: emailLower,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        verified: false,
        resendAttempts: 0,
        verifyAttempts: 0,
        lastResentAt: now,
      });

      await sendRegistrationOTPEmail({ to: emailLower, otp });
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
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const emailLower = email.toLowerCase();
    const otpDoc = await Otp.findOne({
      identifier: emailLower,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc || !otpDoc.otpHash) {
      return res.status(400).json({ message: "OTP expired or invalid. Please request a new one." });
    }

    // Check maximum verification attempts (max 5)
    if (otpDoc.verifyAttempts && otpDoc.verifyAttempts >= 5) {
      await Otp.deleteOne({ _id: otpDoc._id });
      await SecurityLog.create({
        action: "OTP Failed (Max Attempts Exceeded)",
        ip,
        device: browser,
      });
      return res.status(400).json({ message: "Maximum verification attempts exceeded. Please request a new OTP." });
    }

    const isMatch = await bcrypt.compare(String(otp), otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.verifyAttempts = (otpDoc.verifyAttempts || 0) + 1;
      await otpDoc.save();

      await SecurityLog.create({
        action: "OTP Failed",
        ip,
        device: browser,
      });

      return res.status(400).json({
        message: `Invalid OTP. Attempts remaining: ${5 - otpDoc.verifyAttempts}`,
      });
    }

    // Mark as verified, clear hash, extend TTL to 15 mins for registration window
    otpDoc.verified = true;
    otpDoc.otpHash = "verified"; // invalidate hash to prevent re-use
    otpDoc.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await otpDoc.save();

    await SecurityLog.create({
      action: "OTP Verified",
      ip,
      device: browser,
    });

    res.status(200).json({ success: true, message: "Email verified successfully." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/send-mobile-otp
export const sendMobileOTP = async (req: Request, res: Response) => {
  try {
    const { mobile } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!mobile || !validateIndianMobile(mobile)) {
      return res.status(400).json({ message: "Please provide a valid Indian mobile number." });
    }

    const normalizedMobile = normalizeMobile(mobile);

    // Check if user already exists with this mobile number
    const existingUser = await User.findOne({ mobile: normalizedMobile });
    if (existingUser) {
      return res.status(400).json({ message: "User with this mobile number already exists." });
    }

    let otpDoc = await Otp.findOne({ identifier: normalizedMobile });
    const now = new Date();

    if (otpDoc) {
      // 1. Resend cooldown
      if (otpDoc.lastResentAt && now.getTime() - otpDoc.lastResentAt.getTime() < 60 * 1000) {
        const timeRemaining = Math.ceil((60 * 1000 - (now.getTime() - otpDoc.lastResentAt.getTime())) / 1000);
        return res.status(429).json({
          message: `Please wait ${timeRemaining} seconds before requesting another OTP.`,
        });
      }

      // 2. Max resends
      if (otpDoc.resendAttempts && otpDoc.resendAttempts >= 3) {
        return res.status(429).json({
          message: "Maximum OTP resend attempts exceeded. Please try again after 5 minutes.",
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      otpDoc.otpHash = otpHash;
      otpDoc.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      otpDoc.verified = false;
      otpDoc.verifyAttempts = 0;
      otpDoc.resendAttempts = (otpDoc.resendAttempts || 0) + 1;
      otpDoc.lastResentAt = now;
      await otpDoc.save();

      await smsService.sendMobileOTP({ mobile: normalizedMobile, otp });
    } else {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      await Otp.create({
        identifier: normalizedMobile,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        verified: false,
        resendAttempts: 0,
        verifyAttempts: 0,
        lastResentAt: now,
      });

      await smsService.sendMobileOTP({ mobile: normalizedMobile, otp });
    }

    res.status(200).json({ success: true, message: "OTP sent successfully to your mobile number." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-mobile-otp
export const verifyMobileOTP = async (req: Request, res: Response) => {
  try {
    const { mobile, otp } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile number and OTP are required." });
    }

    const normalizedMobile = normalizeMobile(mobile);
    const otpDoc = await Otp.findOne({
      identifier: normalizedMobile,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc || !otpDoc.otpHash) {
      return res.status(400).json({ message: "OTP expired or invalid. Please request a new one." });
    }

    if (otpDoc.verifyAttempts && otpDoc.verifyAttempts >= 5) {
      await Otp.deleteOne({ _id: otpDoc._id });
      await SecurityLog.create({
        action: "OTP Failed (Max Attempts Exceeded)",
        ip,
        device: browser,
      });
      return res.status(400).json({ message: "Maximum verification attempts exceeded. Please request a new OTP." });
    }

    const isMatch = await bcrypt.compare(String(otp), otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.verifyAttempts = (otpDoc.verifyAttempts || 0) + 1;
      await otpDoc.save();

      await SecurityLog.create({
        action: "OTP Failed",
        ip,
        device: browser,
      });

      return res.status(400).json({
        message: `Invalid OTP. Attempts remaining: ${5 - otpDoc.verifyAttempts}`,
      });
    }

    otpDoc.verified = true;
    otpDoc.otpHash = "verified";
    otpDoc.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await otpDoc.save();

    await SecurityLog.create({
      action: "OTP Verified",
      ip,
      device: browser,
    });

    res.status(200).json({ success: true, message: "Mobile number verified successfully." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/register
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

    // Reject duplicates
    const existingUserEmail = await User.findOne({ email: emailLower });
    if (existingUserEmail) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    const existingUserMobile = await User.findOne({ mobile: normalizedMobile });
    if (existingUserMobile) {
      return res.status(400).json({ message: "User with this mobile number already exists." });
    }

    // Verify OTP state in DB
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

    // Create User
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

    // Cleanup OTP records
    await Otp.deleteMany({ identifier: { $in: [emailLower, normalizedMobile] } });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: user.email, customerName: user.name }).catch((err: any) =>
      console.error("Welcome email failed:", err.message)
    );

    // Track initial registration login session
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser, os, device } = parseUserAgent(userAgent);
    const session = await Session.create({
      user: user._id,
      device,
      browser,
      os,
      ipAddress: ip,
      loginTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
    });

    await LoginHistory.create({
      user: user._id,
      email: emailLower,
      browser,
      device,
      ip,
      country: getCountryFromReq(req),
      success: true,
    });

    await SecurityLog.create({
      user: user._id,
      action: "Login",
      ip,
      device: `${browser} / ${os} (${device})`,
    });

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        profilePic: user.profilePic || "",
        emailVerified: user.emailVerified,
        mobileVerified: user.mobileVerified,
      },
      token: generateToken(user._id.toString(), user.role, session._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// Helper functions for CAPTCHA
const generateCaptchaText = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  while (result.length < 6) {
    const byte = crypto.randomBytes(1)[0];
    if (byte < 252) { // 252 is 36 * 7
      result += chars[byte % chars.length];
    }
  }
  return result;
};

const generateCaptchaSvg = (text: string): string => {
  const width = 180;
  const height = 50;
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background: #fdfaf2; border: 1px solid #d4af3733; border-radius: 8px;">`;
  
  // Add noise lines
  for (let i = 0; i < 4; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d4af37" stroke-width="1.5" opacity="0.3" />`;
  }
  
  // Add noise circles
  for (let i = 0; i < 15; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const r = Math.random() * 2 + 1;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#b8860b" opacity="0.25" />`;
  }

  // Draw characters
  const charWidth = width / (text.length + 1);
  const colors = ["#1f2937", "#b8860b", "#4b5563", "#0f172a", "#78350f"];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = (i + 0.5) * charWidth + (Math.random() * 6 - 3);
    const y = 35 + (Math.random() * 8 - 4);
    const rotate = Math.random() * 36 - 18;
    const color = colors[i % colors.length];
    svg += `<text x="${x}" y="${y}" font-family="'Courier New', Courier, monospace" font-size="28" font-weight="900" fill="${color}" transform="rotate(${rotate} ${x} ${y})">${char}</text>`;
  }

  svg += `</svg>`;
  return svg;
};

// GET /api/auth/captcha
export const getCaptcha = async (req: Request, res: Response) => {
  try {
    const text = generateCaptchaText();
    const captchaId = crypto.randomUUID();
    
    await Captcha.create({
      captchaId,
      text,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes TTL
    });

    const captchaSvg = generateCaptchaSvg(text);

    res.json({
      captchaId,
      captchaSvg,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
export const loginUser = async (req: Request, res: Response) => {
  try {
    // Validate request using Zod
    const validatedData = userLoginSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        message: validatedData.error.errors[0].message,
      });
    }

    const { email, password, captchaId, captchaText } = validatedData.data;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser, os, device } = parseUserAgent(userAgent);
    const country = getCountryFromReq(req);

    // Verify Captcha first
    const captchaDoc = await Captcha.findOne({ captchaId, used: false, expiresAt: { $gt: new Date() } });
    if (!captchaDoc) {
      return res.status(400).json({
        message: "CAPTCHA expired or invalid. Please refresh CAPTCHA.",
      });
    }

    // Mark as used immediately to prevent reuse
    captchaDoc.used = true;
    await captchaDoc.save();

    if (captchaText.toUpperCase() !== captchaDoc.text) {
      return res.status(400).json({
        message: "Incorrect CAPTCHA. Please try again.",
      });
    }
    const emailLower = email.toLowerCase();
    const user = await User.findOne({ email: emailLower }).select("+password");

    if (!user || !user.password) {
      await LoginHistory.create({
        email: emailLower,
        browser,
        device,
        ip,
        country,
        success: false,
      });

      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Check temporary lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitTime = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(403).json({
        message: `Account is temporarily locked. Please try again in ${waitTime} minutes.`,
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = new Date();

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lock
        await SecurityLog.create({
          user: user._id,
          action: "Account Locked",
          ip,
          device: `${browser} / ${os} (${device})`,
        });

        // Send lock email
        await sendAccountLockedEmail({
          to: user.email,
          customerName: user.name,
          lockDurationMinutes: 15,
        }).catch((err) => console.error("Lockout email failed:", err.message));
      }

      await user.save();

      await LoginHistory.create({
        user: user._id,
        email: emailLower,
        browser,
        device,
        ip,
        country,
        success: false,
      });

      await SecurityLog.create({
        user: user._id,
        action: "Failed Login",
        ip,
        device: `${browser} / ${os} (${device})`,
      });

      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Role check: Only allow customer/user roles.
    if (user.role !== "customer" && user.role !== "user") {
      await LoginHistory.create({
        user: user._id,
        email: emailLower,
        browser,
        device,
        ip,
        country,
        success: false,
      });

      await SecurityLog.create({
        user: user._id,
        action: "Failed Customer Login (Admin Role)",
        ip,
        device: `${browser} / ${os} (${device})`,
      });

      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Reset lockout counters
    user.failedLoginAttempts = 0;
    user.lastFailedLogin = undefined;
    user.lockUntil = undefined;
    await user.save();

    // Create session
    const session = await Session.create({
      user: user._id,
      device,
      browser,
      os,
      ipAddress: ip,
      loginTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
    });

    await LoginHistory.create({
      user: user._id,
      email: emailLower,
      browser,
      device,
      ip,
      country,
      success: true,
    });

    await SecurityLog.create({
      user: user._id,
      action: "Login",
      ip,
      device: `${browser} / ${os} (${device})`,
    });

    const token = generateToken(user._id.toString(), user.role, session._id.toString());

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        profilePic: user.profilePic || "",
        emailVerified: user.emailVerified,
        mobileVerified: user.mobileVerified,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/admin/send-otp
export const sendAdminOtp = async (req: Request, res: Response) => {
  try {
    const validatedData = adminSendOtpSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        message: validatedData.error.errors[0].message,
      });
    }

    const { email, password } = validatedData.data;
    const emailLower = email.toLowerCase();
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser, os, device } = parseUserAgent(userAgent);
    const country = getCountryFromReq(req);

    // Find the user
    const user = await User.findOne({ email: emailLower }).select("+password");
    if (!user || user.role !== "admin") {
      // Create a dummy login history to prevent admin email harvesting
      await LoginHistory.create({
        email: emailLower,
        browser,
        device,
        ip,
        country,
        success: false,
      });
      return res.status(400).json({ message: "Invalid administrator credentials." });
    }

    // Check temporary lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitTime = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(403).json({
        message: `Account is temporarily locked. Please try again in ${waitTime} minutes.`,
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = new Date();

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        await SecurityLog.create({
          user: user._id,
          action: "Account Locked (Admin OTP Request)",
          ip,
          device: `${browser} / ${os} (${device})`,
        });

        await sendAccountLockedEmail({
          to: user.email,
          customerName: user.name,
          lockDurationMinutes: 15,
        }).catch((err) => console.error("Lockout email failed:", err.message));
      }

      await user.save();

      await LoginHistory.create({
        user: user._id,
        email: emailLower,
        browser,
        device,
        ip,
        country,
        success: false,
      });

      return res.status(400).json({ message: "Invalid administrator credentials." });
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpIdentifier = `admin-login-otp:${emailLower}`;

    // Rate limiting: check resend limits and cooldown
    const existingOtp = await Otp.findOne({ identifier: otpIdentifier });
    const now = new Date();
    if (existingOtp) {
      // Cooldown of 60 seconds
      if (existingOtp.lastResentAt && now.getTime() - existingOtp.lastResentAt.getTime() < 60 * 1000) {
        const remaining = Math.ceil((60 * 1000 - (now.getTime() - existingOtp.lastResentAt.getTime())) / 1000);
        return res.status(429).json({
          message: `Please wait ${remaining} seconds before requesting another OTP.`,
        });
      }

      existingOtp.otpHash = otpHash;
      existingOtp.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
      existingOtp.verified = false;
      existingOtp.verifyAttempts = 0;
      existingOtp.resendAttempts = (existingOtp.resendAttempts || 0) + 1;
      existingOtp.lastResentAt = now;
      await existingOtp.save();
    } else {
      await Otp.create({
        identifier: otpIdentifier,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        verified: false,
        resendAttempts: 0,
        verifyAttempts: 0,
        lastResentAt: now,
      });
    }

    // Send OTP to registered admin email
    await sendAdminLoginOTPEmail({ to: emailLower, otp });

    res.json({
      success: true,
      message: "OTP sent to your registered admin email.",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/admin/login
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const validatedData = adminLoginSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        message: validatedData.error.errors[0].message,
      });
    }

    const { email, password, otp } = validatedData.data;
    const emailLower = email.toLowerCase();
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser, os, device } = parseUserAgent(userAgent);
    const country = getCountryFromReq(req);

    // Find the user
    const user = await User.findOne({ email: emailLower }).select("+password");
    if (!user || user.role !== "admin") {
      return res.status(400).json({ message: "Invalid administrator credentials." });
    }

    // Check temporary lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitTime = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(403).json({
        message: `Account is temporarily locked. Please try again in ${waitTime} minutes.`,
      });
    }

    // Verify password (again for defense-in-depth)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = new Date();

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        await SecurityLog.create({
          user: user._id,
          action: "Account Locked (Admin Login Failed)",
          ip,
          device: `${browser} / ${os} (${device})`,
        });

        await sendAccountLockedEmail({
          to: user.email,
          customerName: user.name,
          lockDurationMinutes: 15,
        }).catch((err) => console.error("Lockout email failed:", err.message));
      }

      await user.save();

      await LoginHistory.create({
        user: user._id,
        email: emailLower,
        browser,
        device,
        ip,
        country,
        success: false,
      });

      return res.status(400).json({ message: "Invalid administrator credentials." });
    }

    // Find the OTP document
    const otpIdentifier = `admin-login-otp:${emailLower}`;
    const otpDoc = await Otp.findOne({ identifier: otpIdentifier });
    if (!otpDoc || otpDoc.expiresAt <= new Date()) {
      return res.status(400).json({ message: "OTP expired or invalid. Please request a new one." });
    }

    // Check attempts limit (max 3)
    if (otpDoc.verifyAttempts && otpDoc.verifyAttempts >= 3) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: "Maximum OTP attempts exceeded. Please generate a new OTP." });
    }

    // Verify OTP hash
    const isOtpMatch = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!isOtpMatch) {
      otpDoc.verifyAttempts = (otpDoc.verifyAttempts || 0) + 1;
      
      if (otpDoc.verifyAttempts >= 3) {
        await Otp.deleteOne({ _id: otpDoc._id });
        return res.status(400).json({
          message: "Invalid OTP. This OTP has been invalidated due to too many failed attempts. Please generate a new OTP.",
        });
      } else {
        await otpDoc.save();
        return res.status(400).json({
          message: `Invalid OTP. Attempts remaining: ${3 - otpDoc.verifyAttempts}`,
        });
      }
    }

    // OTP verified: delete it to prevent reuse
    await Otp.deleteOne({ _id: otpDoc._id });

    // Reset lockout counters
    user.failedLoginAttempts = 0;
    user.lastFailedLogin = undefined;
    user.lockUntil = undefined;
    await user.save();

    // Create session
    const session = await Session.create({
      user: user._id,
      device,
      browser,
      os,
      ipAddress: ip,
      loginTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
    });

    await LoginHistory.create({
      user: user._id,
      email: emailLower,
      browser,
      device,
      ip,
      country,
      success: true,
    });

    await SecurityLog.create({
      user: user._id,
      action: "Admin Login (OTP Verified)",
      ip,
      device: `${browser} / ${os} (${device})`,
    });

    const token = generateToken(user._id.toString(), user.role, session._id.toString());

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        profilePic: user.profilePic || "",
        emailVerified: user.emailVerified,
        mobileVerified: user.mobileVerified,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/logout
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (authReq.sessionDoc) {
      authReq.sessionDoc.isActive = false;
      await authReq.sessionDoc.save();
    }
    
    if (authReq.user) {
      const userAgent = req.headers["user-agent"] || "";
      const { browser, os, device } = parseUserAgent(userAgent);
      await SecurityLog.create({
        user: authReq.user._id,
        action: "Logout",
        ip: req.ip || "Unknown",
        device: `${browser} / ${os} (${device})`,
      });
    }

    res.json({ success: true, message: "Logged out successfully." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/forgot-password (OTP-based)
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailLower = email.toLowerCase();
    const user = await User.findOne({ email: emailLower });

    const genericResponse = {
      success: true,
      message: "If an account exists for that email, a verification OTP has been sent.",
    };

    if (!user) {
      // Don't leak registered emails
      return res.status(200).json(genericResponse);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Save Forgot Password OTP
    await Otp.deleteMany({ identifier: `forgot-password:${emailLower}` });
    await Otp.create({
      identifier: `forgot-password:${emailLower}`,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // valid 10 mins
      verified: false,
      resendAttempts: 0,
      verifyAttempts: 0,
      lastResentAt: new Date(),
    });

    await sendForgotPasswordOTPEmail({ to: emailLower, otp }).catch((err) =>
      console.error("Forgot password OTP email failed:", err.message)
    );

    await SecurityLog.create({
      user: user._id,
      action: "Password Reset Requested",
      ip,
      device: browser,
    });

    return res.status(200).json(genericResponse);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-forgot-otp
export const verifyForgotOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const emailLower = email.toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    const otpDoc = await Otp.findOne({
      identifier: `forgot-password:${emailLower}`,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc || !otpDoc.otpHash) {
      return res.status(400).json({ message: "OTP expired or invalid. Please request a new code." });
    }

    if (otpDoc.verifyAttempts && otpDoc.verifyAttempts >= 5) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: "Maximum verification attempts exceeded. Please try again." });
    }

    const isMatch = await bcrypt.compare(String(otp), otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.verifyAttempts = (otpDoc.verifyAttempts || 0) + 1;
      await otpDoc.save();

      await SecurityLog.create({
        user: user._id,
        action: "OTP Failed",
        ip,
        device: browser,
      });

      return res.status(400).json({ message: `Invalid OTP. Attempts remaining: ${5 - otpDoc.verifyAttempts}` });
    }

    // OTP Verified! Generate a secure password reset token (valid for 10 minutes)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Invalidate OTP
    await Otp.deleteOne({ _id: otpDoc._id });

    await SecurityLog.create({
      user: user._id,
      action: "OTP Verified",
      ip,
      device: browser,
    });

    res.status(200).json({
      success: true,
      resetToken,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!password || !validatePasswordStrength(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user || !user.password) {
      return res.status(400).json({
        message: "Invalid or expired reset token. Please request a new one.",
      });
    }

    // Set new password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmations
    sendPasswordResetSuccessEmail({ to: user.email, customerName: user.name }).catch((err) =>
      console.error("Password reset confirmation email failed:", err.message)
    );
    sendPasswordChangedEmail({ to: user.email, customerName: user.name }).catch((err) =>
      console.error("Password changed alert email failed:", err.message)
    );

    // Invalidate all active sessions on password reset (security best practice)
    await Session.updateMany({ user: user._id }, { isActive: false });

    await SecurityLog.create({
      user: user._id,
      action: "Password Reset",
      ip,
      device: browser,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/profile
export const getProfile = async (req: any, res: Response) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// PUT /api/auth/profile
export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, houseNumber, street, landmark, city, state, country, postalCode } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (name) user.name = name.trim();
    if (houseNumber) user.houseNumber = houseNumber.trim();
    if (street) user.street = street.trim();
    if (landmark !== undefined) user.landmark = landmark.trim();
    if (city) user.city = city.trim();
    if (state) user.state = state.trim();
    if (country) user.country = country.trim();
    if (postalCode) user.postalCode = postalCode.trim();

    // Recompute address block
    const computedAddress = `${user.houseNumber}, ${user.street}${user.landmark ? `, ${user.landmark}` : ""}, ${user.city}, ${user.state}, ${user.country} - ${user.postalCode}`;
    user.address = computedAddress;

    await user.save();

    await SecurityLog.create({
      user: user._id,
      action: "Profile Updated",
      ip: req.ip || "Unknown",
      device: parseUserAgent(req.headers["user-agent"]).browser,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/profile-picture
export const updateProfilePicture = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Delete existing picture if any
    if (user.profilePicPublicId) {
      await deleteFromCloudinary(user.profilePicPublicId).catch((err) =>
        console.error("Cloudinary delete failed:", err.message)
      );
    }

    // Upload new image
    const result = await uploadToCloudinary(req.file.buffer, "kaumudi_profiles");
    user.profilePic = result.secure_url;
    user.profilePicPublicId = result.public_id;
    await user.save();

    await SecurityLog.create({
      user: user._id,
      action: "Profile Picture Updated",
      ip: req.ip || "Unknown",
      device: parseUserAgent(req.headers["user-agent"]).browser,
    });

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully.",
      profilePic: user.profilePic,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/change-password
export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match." });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include at least one uppercase, lowercase, number, and special character.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user || !user.password) {
      return res.status(404).json({ message: "User or password not found." });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Revoke all other sessions on password change
    const currentSessionId = req.sessionDoc?._id;
    if (currentSessionId) {
      await Session.updateMany({ user: user._id, _id: { $ne: currentSessionId } }, { isActive: false });
    } else {
      await Session.updateMany({ user: user._id }, { isActive: false });
    }

    await sendPasswordChangedEmail({ to: user.email, customerName: user.name }).catch((err) =>
      console.error("Password change email failed:", err.message)
    );

    await SecurityLog.create({
      user: user._id,
      action: "Password Changed",
      ip,
      device: browser,
    });

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/change-email/send-otp
export const changeEmailSendOTP = async (req: any, res: Response) => {
  try {
    const { currentPassword, newEmail } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!currentPassword || !newEmail || !validateEmail(newEmail)) {
      return res.status(400).json({ message: "Please provide password and a valid new email address." });
    }

    const newEmailLower = newEmail.toLowerCase();
    if (newEmailLower === req.user.email) {
      return res.status(400).json({ message: "New email must be different from your current email." });
    }

    // Verify Password by loading the user with password field
    const user = await User.findById(req.user._id).select("+password");
    if (!user || !user.password) {
      return res.status(404).json({ message: "User or password not found." });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    // Check if new email is in use
    const exists = await User.findOne({ email: newEmailLower });
    if (exists) {
      return res.status(400).json({ message: "This email address is already in use by another account." });
    }

    // Send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    const identifier = `change-email:${req.user._id}:${newEmailLower}`;
    await Otp.deleteMany({ identifier });
    await Otp.create({
      identifier,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      verified: false,
      resendAttempts: 0,
      verifyAttempts: 0,
      lastResentAt: new Date(),
    });

    await sendEmailChangeOTPEmail({ to: newEmailLower, otp });

    res.status(200).json({ success: true, message: "Verification OTP sent to your new email." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/change-email/verify
export const changeEmailVerify = async (req: any, res: Response) => {
  try {
    const { newEmail, otp } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!newEmail || !otp) {
      return res.status(400).json({ message: "New email and OTP are required." });
    }

    const newEmailLower = newEmail.toLowerCase();
    const identifier = `change-email:${req.user._id}:${newEmailLower}`;

    const otpDoc = await Otp.findOne({
      identifier,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc || !otpDoc.otpHash) {
      return res.status(400).json({ message: "Verification code expired or invalid." });
    }

    if (otpDoc.verifyAttempts && otpDoc.verifyAttempts >= 5) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: "Max verification attempts exceeded." });
    }

    const isMatch = await bcrypt.compare(String(otp), otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.verifyAttempts = (otpDoc.verifyAttempts || 0) + 1;
      await otpDoc.save();
      return res.status(400).json({ message: `Invalid OTP. Attempts remaining: ${5 - otpDoc.verifyAttempts}` });
    }

    // Verified! Update User Email
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.email = newEmailLower;
    user.emailVerified = true;
    await user.save();

    // Cleanup OTP
    await Otp.deleteOne({ _id: otpDoc._id });

    await SecurityLog.create({
      user: user._id,
      action: "Email Changed",
      ip,
      device: browser,
    });

    res.status(200).json({ success: true, message: "Email updated successfully.", email: newEmailLower });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/change-phone/send-otp
export const changePhoneSendOTP = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPhone } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!currentPassword || !newPhone || !validateIndianMobile(newPhone)) {
      return res.status(400).json({ message: "Please provide current password and a valid new mobile number." });
    }

    const normalizedPhone = normalizeMobile(newPhone);
    if (normalizedPhone === req.user.mobile) {
      return res.status(400).json({ message: "New mobile number must be different from current." });
    }

    // Verify password by fetching user with password
    const user = await User.findById(req.user._id).select("+password");
    if (!user || !user.password) {
      return res.status(404).json({ message: "User or password not found." });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    const exists = await User.findOne({ mobile: normalizedPhone });
    if (exists) {
      return res.status(400).json({ message: "This mobile number is already in use." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    const identifier = `change-phone:${req.user._id}:${normalizedPhone}`;
    await Otp.deleteMany({ identifier });
    await Otp.create({
      identifier,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verified: false,
      resendAttempts: 0,
      verifyAttempts: 0,
      lastResentAt: new Date(),
    });

    await smsService.sendMobileOTP({ mobile: normalizedPhone, otp });

    res.status(200).json({ success: true, message: "Verification OTP sent to your new mobile number." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/change-phone/verify
export const changePhoneVerify = async (req: any, res: Response) => {
  try {
    const { newPhone, otp } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!newPhone || !otp) {
      return res.status(400).json({ message: "New mobile number and OTP are required." });
    }

    const normalizedPhone = normalizeMobile(newPhone);
    const identifier = `change-phone:${req.user._id}:${normalizedPhone}`;

    const otpDoc = await Otp.findOne({
      identifier,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc || !otpDoc.otpHash) {
      return res.status(400).json({ message: "Verification code expired or invalid." });
    }

    if (otpDoc.verifyAttempts && otpDoc.verifyAttempts >= 5) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: "Max verification attempts exceeded." });
    }

    const isMatch = await bcrypt.compare(String(otp), otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.verifyAttempts = (otpDoc.verifyAttempts || 0) + 1;
      await otpDoc.save();
      return res.status(400).json({ message: `Invalid OTP. Attempts remaining: ${5 - otpDoc.verifyAttempts}` });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.mobile = normalizedPhone;
    user.mobileVerified = true;
    await user.save();

    await Otp.deleteOne({ _id: otpDoc._id });

    await SecurityLog.create({
      user: user._id,
      action: "Phone Changed",
      ip,
      device: browser,
    });

    res.status(200).json({ success: true, message: "Mobile number updated successfully.", mobile: normalizedPhone });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
