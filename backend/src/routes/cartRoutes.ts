import express from "express";

import { protect } from "../middlewares/auth.js";
import { customerOnly } from "../middlewares/customer.js";

import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.post(
  "/add",
  protect,
  customerOnly,
  addToCart
);

router.get(
  "/",
  protect,
  customerOnly,
  getCart
);

router.put(
  "/update",
  protect,
  customerOnly,
  updateCartItem
);

router.patch(
  "/update-quantity",
  protect,
  customerOnly,
  updateCartItem
);

router.patch(
  "/:productId",
  protect,
  customerOnly,
  updateCartItem
);

router.delete(
  "/remove/:productId",
  protect,
  customerOnly,
  removeCartItem
);

router.delete(
  "/clear",
  protect,
  customerOnly,
  clearCart
);

router.post(
  "/merge",
  protect,
  customerOnly,
  mergeCart
);

export default router;