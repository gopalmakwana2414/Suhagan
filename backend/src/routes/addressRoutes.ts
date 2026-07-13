import express from "express";

import { protect } from "../middlewares/auth.js";
import { customerOnly } from "../middlewares/customer.js";

import {
  createAddress,
  getAddresses,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/addressController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  customerOnly,
  createAddress
);

router.get(
  "/",
  protect,
  customerOnly,
  getAddresses
);

router.put(
  "/:id",
  protect,
  customerOnly,
  updateAddress
);

router.patch(
  "/default/:id",
  protect,
  customerOnly,
  setDefaultAddress
);

router.delete(
  "/:id",
  protect,
  customerOnly,
  deleteAddress
);

export default router;