import express from "express";
import { protect } from "../middlewares/auth";
import { adminOnly } from "../middlewares/admin";
import {
  subscribeToNewsletter,
  getSubscribers,
  removeSubscriber,
} from "../controllers/subscriberController";

const router = express.Router();

// Private subscribe endpoint (requires login)
router.post("/", protect as any, subscribeToNewsletter as any);

// Protected Admin-only endpoints
router.get("/", protect as any, adminOnly as any, getSubscribers as any);
router.delete("/:id", protect as any, adminOnly as any, removeSubscriber as any);

export default router;
