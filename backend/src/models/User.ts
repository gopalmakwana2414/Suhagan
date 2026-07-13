import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  mobile?: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  houseNumber?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  address?: string;
  // Reset flow stores only a SHA-256 hash of the token, never the raw
  // token itself — mirrors how the password hash works, so a database
  // leak can't be used to reset accounts directly.
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  failedLoginAttempts?: number;
  lastFailedLogin?: Date;
  lockUntil?: Date;
  profilePic?: string;
  profilePicPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    mobileVerified: {
      type: Boolean,
      default: false,
    },

    houseNumber: {
      type: String,
      trim: true,
    },

    street: {
      type: String,
      trim: true,
    },

    landmark: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    postalCode: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLogin: {
      type: Date,
    },
    lockUntil: {
      type: Date,
    },
    profilePic: {
      type: String,
    },
    profilePicPublicId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);