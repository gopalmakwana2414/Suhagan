import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Order } from "./models/Order.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.");

  const orderId = "6a534e9674e07cee5c238faf";
  console.log(`Inspecting order ${orderId}:`);
  const order = await Order.findById(orderId).populate("user").populate("shippingAddress");
  console.log(JSON.stringify(order, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
