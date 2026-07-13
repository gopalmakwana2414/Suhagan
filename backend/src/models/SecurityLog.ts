import mongoose, { Schema, Document } from "mongoose";

export interface ISecurityLog extends Document {
  user?: mongoose.Types.ObjectId;
  time: Date;
  action: string;
  ip: string;
  device: string;
  createdAt: Date;
  updatedAt: Date;
}

const securityLogSchema = new Schema<ISecurityLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    time: {
      type: Date,
      default: Date.now,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: "Unknown",
    },
    device: {
      type: String,
      default: "Unknown",
    },
  },
  {
    timestamps: true,
  }
);

export const SecurityLog = mongoose.model<ISecurityLog>("SecurityLog", securityLogSchema);
