import express from "express";
import { protect } from "../middlewares/auth.js";
import { adminOnly } from "../middlewares/admin.js";
import {
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
  getAllCustomers,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  changeAdminEmail,
  changeAdminPhone,
  logoutAllSessions,
  getAdminLoginHistory,
  getAdminSecurityLogs,
  getAdminSessions,
  deleteAdminSession,
} from "../controllers/adminController.js";

const router = express.Router();

// Orders (Admin Only)
router.get("/orders", protect, adminOnly, getAllOrders);
router.get("/orders/:id", protect, adminOnly, getOrderByIdAdmin);
router.patch("/orders/:id/status", protect, adminOnly, updateOrderStatus);

// Customers (Admin Only)
router.get("/customers", protect, adminOnly, getAllCustomers);

// Admin Profile & Security Operations (Protected + Admin Only)
router.get("/profile", protect, adminOnly, getAdminProfile);
router.put("/profile", protect, adminOnly, updateAdminProfile);
router.put("/change-password", protect, adminOnly, changeAdminPassword);
router.put("/change-email", protect, adminOnly, changeAdminEmail);
router.put("/change-phone", protect, adminOnly, changeAdminPhone);
router.post("/logout-all", protect, adminOnly, logoutAllSessions);

// Audit Logs, Login History & Active Sessions (Protected + Admin Only)
router.get("/login-history", protect, adminOnly, getAdminLoginHistory);
router.get("/security-logs", protect, adminOnly, getAdminSecurityLogs);
router.get("/sessions", protect, adminOnly, getAdminSessions);
router.delete("/session/:id", protect, adminOnly, deleteAdminSession);

export default router;
