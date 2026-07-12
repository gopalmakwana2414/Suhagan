import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";

import { protect } from "../middlewares/auth";
import { adminOnly } from "../middlewares/admin";
import { upload } from "../middlewares/upload";

const router = express.Router();

router.get("/", getCategories);

router.post("/", protect, adminOnly, upload.single("image"), createCategory);

router.put("/:id", protect, adminOnly, upload.single("image"), updateCategory);

router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
