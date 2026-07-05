import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async () => {
  try {
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI missing in environment");
    }

    await mongoose.connect(env.MONGO_URI, {
      // caps how many concurrent DB operations a single server instance
      // can have in flight — without this it falls back to the driver
      // default, which isn't tuned for this app specifically
      maxPoolSize: 50,
      minPoolSize: 5,
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (error: any) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};