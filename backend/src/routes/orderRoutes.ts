import express from "express";

import { protect } from "../middlewares/auth.js";
import { customerOnly } from "../middlewares/customer.js";
import { createOrderLimiter } from "../middlewares/rateLimiter.js";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  downloadInvoice,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", protect, customerOnly, createOrderLimiter, createOrder);

router.get("/", protect, customerOnly, getMyOrders);

router.get("/:id", protect, customerOnly, getOrderById);

router.get("/:id/invoice", protect, downloadInvoice);

export default router;
