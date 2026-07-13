import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Address } from "../models/Address.js";
import { Order } from "../models/Order.js";
import { sendAdminOrderAlert } from "../services/emailService.js";
import logger from "../utils/logger.js";

async function run() {
  logger.info("🧪 Starting Admin Notification Email System Test...");
  await connectDB();

  // 1. Ensure an Admin user exists in DB
  let adminUser = await User.findOne({ role: "admin" });
  let createdAdmin = false;
  if (!adminUser) {
    logger.info("No admin user found. Creating a temporary admin user...");
    adminUser = await User.create({
      name: "Kaumudi Admin Test",
      email: "g91652251@gmail.com", // This will receive the email
      password: "temporarypassword123",
      role: "admin",
      emailVerified: true
    });
    createdAdmin = true;
    logger.info(`Temporary admin user created: ${adminUser.email}`);
  } else {
    logger.info(`Found existing admin user: ${adminUser.email}`);
  }

  // 2. Fetch or create a test order
  let order = await Order.findOne()
    .populate("shippingAddress")
    .populate("items.product")
    .populate("user");

  let createdTempOrder = false;
  let tempUserId = new mongoose.Types.ObjectId();
  let tempAddressId = new mongoose.Types.ObjectId();
  let tempProductId = new mongoose.Types.ObjectId();
  let tempOrderId = new mongoose.Types.ObjectId();

  if (!order) {
    logger.info("No existing order found. Creating a full temporary order workflow...");

    // Create temp customer
    const customer = await User.create({
      _id: tempUserId,
      name: "Customer John Doe",
      email: "john.doe.customer@example.com",
      password: "customerpassword123",
      role: "user",
      mobile: "+91 98765 43210"
    });

    // Create temp product
    const product = await Product.create({
      _id: tempProductId,
      name: "Zari Border Silk Banarasi Saree",
      slug: "zari-border-silk-banarasi-saree-" + Date.now(),
      shortDescription: "Handcrafted pure silk luxury saree from Surat weavers.",
      description: "Detailed description of the luxury saree.",
      sku: "KMD-BAN-001",
      originalPrice: 15999,
      salePrice: 12999,
      stock: 5,
      category: new mongoose.Types.ObjectId(),
      thumbnail: {
        url: "https://res.cloudinary.com/dq7urdhzp/image/upload/v1720894000/saree_thumb.jpg",
        public_id: "saree_thumb"
      },
      isActive: true
    });

    // Create temp address
    const address = await Address.create({
      _id: tempAddressId,
      user: tempUserId,
      fullName: "Jane Doe (Gift Delivery)",
      mobileNumber: "+91 99999 88888",
      addressLine1: "Villa 24, Golden Meadows, Ring Road",
      addressLine2: "Near Silk Market",
      city: "Surat",
      state: "Gujarat",
      postalCode: "395002",
      country: "India"
    });

    // Create temp order
    const newOrder = await Order.create({
      _id: tempOrderId,
      user: tempUserId,
      items: [{ product: tempProductId, quantity: 1, price: 12999 }],
      shippingAddress: tempAddressId,
      totalItems: 1,
      totalAmount: 13098, // 12999 + 99 shipping
      couponCode: "WELCOME10",
      discountAmount: 1300,
      paymentMethod: "ONLINE",
      paymentStatus: "paid",
      orderStatus: "confirmed",
      createdAt: new Date()
    });

    order = await Order.findById(tempOrderId)
      .populate("shippingAddress")
      .populate("items.product")
      .populate("user");

    createdTempOrder = true;
    logger.info(`Temporary order placed: ${order?._id}`);
  }

  if (order) {
    logger.info("Populating and formatting email content...");
    
    // Call the admin order alert notification function
    await sendAdminOrderAlert(order);
    logger.info("🎉 Success! Admin notification email sent successfully.");
  } else {
    logger.error("Failed to construct order for test.");
  }

  // 3. Clean up
  logger.info("Cleaning up temporary test data...");
  if (createdAdmin && adminUser) {
    await User.findByIdAndDelete(adminUser._id);
    logger.info("Removed temporary admin user.");
  }
  if (createdTempOrder) {
    await Order.findByIdAndDelete(tempOrderId);
    await Address.findByIdAndDelete(tempAddressId);
    await Product.findByIdAndDelete(tempProductId);
    await User.findByIdAndDelete(tempUserId);
    logger.info("Removed temporary order, address, product, and customer documents.");
  }

  await mongoose.disconnect();
  logger.info("Database disconnected. Test completed.");
}

run().catch((err) => {
  logger.error(`❌ Test failed with error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
