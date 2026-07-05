import { Request, Response } from "express";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { sendOrderStatusEmail } from "../services/emailService";

// get all orders
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const [orders, totalOrders] = await Promise.all([
      Order.find()
        .populate("user", "name email")
        .populate("shippingAddress")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(),
    ]);

    return res.status(200).json({
      orders,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalOrders / limit)),
      totalOrders,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// get order by id
export const getOrderByIdAdmin = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("shippingAddress")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json(order);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.orderStatus = status;

    await order.save();

    // Notify customer via email (non-blocking)
    User.findById(order.user)
      .then((user) => {
        if (user) {
          sendOrderStatusEmail({
            to: user.email,
            customerName: user.name,
            orderId: order._id.toString(),
            status,
          }).catch((err) =>
            console.error("Status email failed:", err.message)
          );
        }
      })
      .catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// get all customers (users)
export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const [users, totalUsers] = await Promise.all([
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      users,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
      totalUsers,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
