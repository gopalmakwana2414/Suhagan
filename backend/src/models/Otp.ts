import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  identifier: string; // email or mobile number
  otpHash: string; // bcrypt hash of the OTP, cleared after verification
  expiresAt: Date; // TTL expiry
  verified: boolean; // flag indicating if identifier is verified
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    identifier: {
      type: String,
      required: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically delete after expiresAt date
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize query for finding verified status
otpSchema.index({ identifier: 1, verified: 1 });

export const Otp = mongoose.model<IOtp>("Otp", otpSchema);
