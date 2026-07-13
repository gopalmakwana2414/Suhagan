import express from "express";
import {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  createCODOrder,
} from "../controllers/paymentController.js";
import { handleWebhook } from "../controllers/webhookController.js";

import { protect } from "../middlewares/auth.js";
import { customerOnly } from "../middlewares/customer.js";
import { createOrderLimiter, verifyPaymentLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Create Razorpay order
router.post(
  "/create-order",
  protect,
  customerOnly,
  createOrderLimiter,
  createRazorpayOrder
);

// Verify payment + create order
router.post(
  "/verify",
  protect,
  customerOnly,
  verifyPaymentLimiter,
  verifyPaymentAndCreateOrder
);

// COD order
router.post(
  "/cod",
  protect,
  customerOnly,
  createOrderLimiter,
  createCODOrder
);

// Razorpay Webhook
router.post(
  "/webhook",
  handleWebhook
);

export default router;