import express from "express";

import { protect } from "../middlewares/auth.js";
import { adminOnly } from "../middlewares/admin.js";
import { customerOnly } from "../middlewares/customer.js";

import {
  createCoupon,
  getCoupons,
  applyCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";

const router = express.Router();



// ADMIN
router.post(
  "/",
  protect,
  adminOnly,
  createCoupon
);

router.put(
  "/:id",
  protect,
  adminOnly,
  updateCoupon
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteCoupon
);

router.get(
  "/",
  protect,
  adminOnly,
  getCoupons
);



// USER
router.post(
  "/apply",
  protect,
  customerOnly,
  applyCoupon
);

export default router;