import { Request, Response } from "express";
import mongoose from "mongoose";

import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Address } from "../models/Address.js";
import { acquireLock, releaseLock } from "../services/lockService.js";
import { processOrderCreation } from "../services/paymentService.js";
import { enqueueJob, JOB_INVOICE_AND_EMAIL } from "../services/queueService.js";
import logger from "../utils/logger.js";

// create order from cart
export const createOrder = async (
  req: Request,
  res: Response
) => {
  const userId = (req as any).user.id;
  const { addressId } = req.body;

  if (!addressId) {
    return res.status(400).json({
      message: "Address ID is required",
    });
  }

  // 1. Acquire distributed lock on user ID to prevent concurrent checkout requests
  const userLockKey = `checkout:user:${userId}`;
  let userLockAcquired = false;
  try {
    userLockAcquired = await acquireLock(userLockKey, 15000);
  } catch (lockErr: any) {
    logger.error(`Lock service error in legacy createOrder: ${lockErr.message}`);
    return res.status(503).json({
      message: "Checkout service temporarily offline. Please try again.",
    });
  }

  if (!userLockAcquired) {
    logger.warn(`User checkout lock busy: ${userLockKey}`);
    return res.status(409).json({
      message: "Another checkout request is currently in progress. Please wait a moment.",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const cart = await Cart.findOne({
      user: userId,
    }).session(session);

    if (
      !cart ||
      cart.items.length === 0
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    const items = cart.items.map((item: any) => ({
      product: item.product.toString(),
      quantity: item.quantity,
    }));

    // 2. Call unified checkout logic (paymentMethod: COD)
    const { order } = await processOrderCreation(
      userId,
      items,
      undefined, // Coupon code not supported directly on this legacy route
      addressId,
      "COD",
      session
    );

    await session.commitTransaction();
    session.endSession();

    logger.info(`COD Order created successfully via legacy endpoint: ${order._id}`);

    // clear cart is already handled inside processOrderCreation for COD orders
    // Enqueue Invoice & Email jobs
    await enqueueJob(JOB_INVOICE_AND_EMAIL, order._id.toString());

    return res.status(201).json(order);
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`Error in legacy createOrder endpoint: ${error.message}`);
    return res.status(400).json({
      message: error.message || "Failed to place order",
    });
  } finally {
    try {
      await releaseLock(userLockKey);
    } catch (releaseErr: any) {
      logger.error(`Failed to release checkout lock: ${releaseErr.message}`);
    }
  }
};

// get my orders
export const getMyOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const orders =
      await Order.find({
        user: userId,
      })
        .populate(
          "shippingAddress"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json(
      orders
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// get single order
export const getOrderById =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = (
        req as any
      ).user.id;

      const order =
        await Order.findOne({
          _id: req.params.id,
          user: userId,
        })
          .populate(
            "shippingAddress"
          )
          .populate(
            "items.product"
          );

      if (!order) {
        return res
          .status(404)
          .json({
            message:
              "Order not found",
          });
      }

      return res
        .status(200)
        .json(order);
    } catch (error: any) {
      return res
        .status(500)
        .json({
          message:
            error.message,
        });
    }
  };

// download invoice pdf
import { generateInvoicePDF } from "../services/invoiceService";

export const downloadInvoice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const jwtPayload = (req as any).jwtPayload;

    if (!user || !jwtPayload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isUserAdmin = user.role === "admin";
    const isJwtAdmin = jwtPayload.role === "admin";
    const isAdmin = isUserAdmin && isJwtAdmin;

    const isUserCustomer = user.role === "customer" || user.role === "user";
    const isJwtCustomer = jwtPayload.role === "customer" || jwtPayload.role === "user";
    const isCustomer = isUserCustomer && isJwtCustomer;

    const filter: any = { _id: req.params.id };

    if (isAdmin) {
      // Admin can download any invoice
    } else if (isCustomer) {
      // Customer can only download their own invoice
      filter.user = user.id || user._id;
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const order = await Order.findOne(filter)
      .populate("shippingAddress")
      .populate("items.product", "name sku")
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    await generateInvoicePDF(order as any, res);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
