import express from "express";

import { protect } from "../middlewares/auth";
import { adminOnly } from "../middlewares/admin";

import {
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
  getAllCustomers,
} from "../controllers/adminController";

const router = express.Router();

// orders

router.get(
  "/orders",
  protect,
  adminOnly,
  getAllOrders
);

router.get(
  "/orders/:id",
  protect,
  adminOnly,
  getOrderByIdAdmin
);

router.patch(
  "/orders/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);

// customers

router.get(
  "/customers",
  protect,
  adminOnly,
  getAllCustomers
);

export default router;
