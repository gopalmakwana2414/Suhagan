import express from "express";

import { protect } from "../middlewares/auth.js";
import { customerOnly } from "../middlewares/customer.js";

import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.post(
  "/add",
  protect,
  customerOnly,
  addToWishlist
);

router.get(
  "/",
  protect,
  customerOnly,
  getWishlist
);

router.delete(
  "/remove/:productId",
  protect,
  customerOnly,
  removeFromWishlist
);

export default router;