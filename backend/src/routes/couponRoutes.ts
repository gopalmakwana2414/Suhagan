import express from "express";

import { protect } from "../middlewares/auth";
import { adminOnly } from "../middlewares/admin";

import {
  createCoupon,
  getCoupons,
  applyCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController";

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
  applyCoupon
);

export default router;