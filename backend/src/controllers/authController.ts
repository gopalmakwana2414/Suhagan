import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { generateToken } from "../utils/jwt";
import { sendWelcomeEmail, sendResetPasswordEmail } from "../services/emailService";

// register
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Send welcome email (non-blocking — don't fail registration if email fails)
    sendWelcomeEmail({ to: user.email, customerName: user.name }).catch(
      (err) => console.error("Welcome email failed:", err.message)
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
