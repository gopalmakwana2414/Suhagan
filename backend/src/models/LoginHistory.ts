import mongoose, { Schema, Document } from "mongoose";

export interface ILoginHistory extends Document {
  user?: mongoose.Types.ObjectId;
  email: string;
  time: Date;
  browser: string;
  device: string;
  ip: string;
  country: string;
  success: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const loginHistorySchema = new Schema<ILoginHistory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    time: {
      type: Date,
      default: Date.now,
      index: true,
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    device: {
      type: String,
      default: "Unknown",
    },
    ip: {
      type: String,
      default: "Unknown",
    },
    country: {
      type: String,
      default: "Unknown",
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LoginHistory = mongoose.model<ILoginHistory>("LoginHistory", loginHistorySchema);
