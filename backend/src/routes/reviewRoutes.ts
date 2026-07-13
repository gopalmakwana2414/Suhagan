import express from "express";

import { protect } from "../middlewares/auth.js";
import { customerOnly } from "../middlewares/customer.js";

import {
  createReview,
  getProductReviews,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

// GET ALL REVIEWS OF PRODUCT (public)
router.get("/product/:productId", getProductReviews);

// ADD REVIEW (must be logged in)
router.post("/product/:productId", protect, customerOnly, createReview);

// DELETE REVIEW (owner or admin)
router.delete("/:reviewId", protect, deleteReview);

export default router;
