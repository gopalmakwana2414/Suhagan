import mongoose, { Schema, Document } from "mongoose";

export interface ICaptcha extends Document {
  captchaId: string;
  text: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const captchaSchema = new Schema<ICaptcha>(
  {
    captchaId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto delete after expiresAt date
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Captcha = mongoose.model<ICaptcha>("Captcha", captchaSchema);
