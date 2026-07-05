import express from "express";
import { protect } from "../middlewares/auth";
import { adminOnly } from "../middlewares/admin";
import { upload } from "../middlewares/upload";

import {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";

const router = express.Router();

// public routes

router.get("/", getProducts);

router.get("/:slug", getProductBySlug);

// admin routes

router.post(
  "/",
  protect,
  adminOnly,
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
    {
      name: "images",
      maxCount: 10,
    },
  ]),
  createProduct
);

router.put(
  "/:id",
  protect,
  adminOnly,
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
    {
      name: "images",
      maxCount: 10,
    },
  ]),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteProduct
);

export default router;