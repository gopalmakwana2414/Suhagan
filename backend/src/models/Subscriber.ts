import mongoose, { Document, Schema } from "mongoose";

export interface ISubscriber extends Document {
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const Subscriber = mongoose.model<ISubscriber>(
  "Subscriber",
  subscriberSchema
);
