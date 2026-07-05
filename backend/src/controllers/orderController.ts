import { Request, Response } from "express";

import { Cart } from "../models/Cart";
import { Order } from "../models/Order";
import { Address } from "../models/Address";

// create order from cart
export const createOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { addressId } = req.body;

    const address =
      await Address.findOne({
        _id: addressId,
        user: userId,
      });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    const cart = await Cart.findOne({
      user: userId,
    });

    if (
      !cart ||
      cart.items.length === 0
    ) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    const order = await Order.create({
      user: userId,

      items: cart.items,

      shippingAddress:
        address._id,

      totalItems:
        cart.totalItems,

      totalAmount:
        cart.totalAmount,

      paymentMethod: "COD",
    });

    // clear cart after order

    cart.items = [];
    cart.totalItems = 0;
    cart.totalAmount = 0;

    await cart.save();

    return res.status(201).json(
      order
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
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
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const filter: any = { _id: req.params.id };

    // Customers can only download their own invoice; admins can download any.
    if (userRole !== "admin") {
      filter.user = userId;
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

    generateInvoicePDF(order as any, res);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
