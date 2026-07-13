import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Session } from "../models/Session.js";
import { LoginHistory } from "../models/LoginHistory.js";
import { SecurityLog } from "../models/SecurityLog.js";
import { Otp } from "../models/Otp.js";
import { sendOrderStatusEmail, sendEmailChangeOTPEmail, sendPasswordChangedEmail } from "../services/emailService.js";
import smsService from "../services/smsService.js";
import { runTransactionWithRetry } from "../utils/dbUtils.js";
import { parseUserAgent } from "../utils/helpers.js";

// get all orders
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const [orders, totalOrders] = await Promise.all([
      Order.find()
        .populate("user", "name email")
        .populate("shippingAddress")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(),
    ]);

    return res.status(200).json({
      orders,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalOrders / limit)),
      totalOrders,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// get order by id
export const getOrderByIdAdmin = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("shippingAddress")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json(order);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const updatedOrder = await runTransactionWithRetry(async (session) => {
      const order = await Order.findById(req.params.id).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      // If status is being changed to cancelled, and it is not already cancelled, restore stock
      if (status === "cancelled" && order.orderStatus !== "cancelled") {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      }

      order.orderStatus = status;
      await order.save({ session });
      return order;
    });

    // Notify customer via email (non-blocking)
    User.findById(updatedOrder.user)
      .then((user) => {
        if (user) {
          sendOrderStatusEmail({
            to: user.email,
            customerName: user.name,
            orderId: updatedOrder._id.toString(),
            status,
          }).catch((err) =>
            console.error("Status email failed:", err.message)
          );
        }
      })
      .catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      order: updatedOrder,
    });
  } catch (error: any) {
    if (error.message === "Order not found") {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
};

// get all customers (users)
export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const [users, totalUsers] = await Promise.all([
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      users,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
      totalUsers,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET /admin/profile
export const getAdminProfile = async (req: any, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /admin/profile
export const updateAdminProfile = async (req: any, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 characters." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Admin user not found." });
    }

    user.name = name.trim();
    await user.save();

    await SecurityLog.create({
      user: user._id,
      action: "Profile Updated",
      ip: req.ip || "Unknown",
      device: parseUserAgent(req.headers["user-agent"]).browser,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /admin/change-password
export const changeAdminPassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const admin = await User.findById(req.user._id).select("+password");
    if (!admin || !admin.password) {
      return res.status(404).json({ message: "Admin or password not found." });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    // Revoke all other admin sessions
    const currentSessionId = req.sessionDoc?._id;
    if (currentSessionId) {
      await Session.updateMany({ user: admin._id, _id: { $ne: currentSessionId } }, { isActive: false });
    } else {
      await Session.updateMany({ user: admin._id }, { isActive: false });
    }

    sendPasswordChangedEmail({ to: admin.email, customerName: admin.name }).catch((err) =>
      console.error("Admin password change email failed:", err.message)
    );

    await SecurityLog.create({
      user: admin._id,
      action: "Password Changed",
      ip: req.ip || "Unknown",
      device: parseUserAgent(req.headers["user-agent"]).browser,
    });

    return res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /admin/change-email (Dual-Stage: Send OTP if OTP missing, verify if OTP present)
export const changeAdminEmail = async (req: any, res: Response) => {
  try {
    const { currentPassword, newEmail, otp } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!currentPassword || !newEmail) {
      return res.status(400).json({ message: "Password and new email are required." });
    }

    const newEmailLower = newEmail.toLowerCase();
    const admin = await User.findById(req.user._id).select("+password");
    if (!admin || !admin.password) {
      return res.status(404).json({ message: "Admin or password not found." });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(String(currentPassword), admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    if (newEmailLower === admin.email) {
      return res.status(400).json({ message: "New email must be different from current email." });
    }

    const exists = await User.findOne({ email: newEmailLower });
    if (exists) {
      return res.status(400).json({ message: "This email is already in use." });
    }

    const identifier = `change-email:${admin._id}:${newEmailLower}`;

    if (!otp) {
      // Stage 1: Send OTP to new email
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(generatedOtp, 10);

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

      await sendEmailChangeOTPEmail({ to: newEmailLower, otp: generatedOtp });

      return res.status(200).json({
        success: true,
        otpRequired: true,
        message: "Verification OTP has been sent to your new email.",
      });
    } else {
      // Stage 2: Verify OTP and Update Email
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

      const isOtpMatch = await bcrypt.compare(String(otp), otpDoc.otpHash);
      if (!isOtpMatch) {
        otpDoc.verifyAttempts = (otpDoc.verifyAttempts || 0) + 1;
        await otpDoc.save();
        return res.status(400).json({ message: `Invalid OTP. Attempts remaining: ${5 - otpDoc.verifyAttempts}` });
      }

      admin.email = newEmailLower;
      await admin.save();

      await Otp.deleteOne({ _id: otpDoc._id });

      await SecurityLog.create({
        user: admin._id,
        action: "Email Changed",
        ip,
        device: browser,
      });

      return res.status(200).json({
        success: true,
        message: "Email updated successfully.",
        email: newEmailLower,
      });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /admin/change-phone (Dual-Stage: Send OTP if OTP missing, verify if OTP present)
export const changeAdminPhone = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPhone, otp } = req.body;
    const ip = req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const { browser } = parseUserAgent(userAgent);

    if (!currentPassword || !newPhone) {
      return res.status(400).json({ message: "Password and new phone are required." });
    }

    const admin = await User.findById(req.user._id).select("+password");
    if (!admin || !admin.password) {
      return res.status(404).json({ message: "Admin or password not found." });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    const normalizedPhone = newPhone.replace(/\D/g, "");
    if (normalizedPhone === admin.mobile) {
      return res.status(400).json({ message: "New mobile number must be different from current." });
    }

    const exists = await User.findOne({ mobile: normalizedPhone });
    if (exists) {
      return res.status(400).json({ message: "This mobile number is already in use." });
    }

    const identifier = `change-phone:${admin._id}:${normalizedPhone}`;

    if (!otp) {
      // Stage 1: Send OTP to new phone
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(generatedOtp, 10);

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

      await smsService.sendMobileOTP({ mobile: normalizedPhone, otp: generatedOtp });

      return res.status(200).json({
        success: true,
        otpRequired: true,
        message: "Verification OTP has been sent to your new mobile number.",
      });
    } else {
      // Stage 2: Verify OTP
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

      const isOtpMatch = await bcrypt.compare(String(otp), otpDoc.otpHash);
      if (!isOtpMatch) {
        otpDoc.verifyAttempts = (otpDoc.verifyAttempts || 0) + 1;
        await otpDoc.save();
        return res.status(400).json({ message: `Invalid OTP. Attempts remaining: ${5 - otpDoc.verifyAttempts}` });
      }

      admin.mobile = normalizedPhone;
      admin.mobileVerified = true;
      await admin.save();

      await Otp.deleteOne({ _id: otpDoc._id });

      await SecurityLog.create({
        user: admin._id,
        action: "Phone Changed",
        ip,
        device: browser,
      });

      return res.status(200).json({
        success: true,
        message: "Mobile number updated successfully.",
        mobile: normalizedPhone,
      });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /admin/logout-all
export const logoutAllSessions = async (req: any, res: Response) => {
  try {
    await Session.updateMany({ user: req.user._id }, { isActive: false });
    await SecurityLog.create({
      user: req.user._id,
      action: "Logout (All Devices)",
      ip: req.ip || "Unknown",
      device: parseUserAgent(req.headers["user-agent"]).browser,
    });
    return res.status(200).json({ success: true, message: "Logged out from all devices successfully." });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /admin/login-history
export const getAdminLoginHistory = async (req: Request, res: Response) => {
  try {
    const history = await LoginHistory.find()
      .populate("user", "name email role")
      .sort({ time: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({ success: true, history });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /admin/security-logs
export const getAdminSecurityLogs = async (req: Request, res: Response) => {
  try {
    const logs = await SecurityLog.find()
      .populate("user", "name email role")
      .sort({ time: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({ success: true, logs });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /admin/sessions
export const getAdminSessions = async (req: any, res: Response) => {
  try {
    const sessions = await Session.find({ user: req.user._id, isActive: true })
      .sort({ lastActivity: -1 })
      .lean();

    const currentSessionId = req.sessionDoc?._id?.toString();

    const formattedSessions = sessions.map((sess) => ({
      ...sess,
      isCurrent: sess._id.toString() === currentSessionId,
    }));

    return res.status(200).json({ success: true, sessions: formattedSessions });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /admin/session/:id
export const deleteAdminSession = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await Session.updateOne({ _id: id, user: req.user._id }, { isActive: false });

    await SecurityLog.create({
      user: req.user._id,
      action: `Session Terminated: ${id}`,
      ip: req.ip || "Unknown",
      device: parseUserAgent(req.headers["user-agent"]).browser,
    });

    return res.status(200).json({ success: true, message: "Session revoked successfully." });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
