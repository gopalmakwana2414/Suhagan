import { Request, Response } from "express";
import crypto from "crypto";
import { razorpay } from "../services/razorpayService";
import { Order } from "../models/Order";
import { Address } from "../models/Address";
import { Product } from "../models/Product";
import { Coupon } from "../models/Coupon";
import { User } from "../models/User";
import {
  sendOrderConfirmationEmail,
  sendAdminOrderAlert,
} from "../services/emailService";

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 99;

// recalculates the cart total from the DB every time instead of trusting
// whatever price the client sends — otherwise someone could just edit the
// request and pay ₹1 for a ₹50,000 order
const calculateOrderTotals = async (
  items: { product: string; quantity: number }[],
  couponCode?: string
) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty");
  }

  const resolvedItems: { product: string; quantity: number; price: number }[] = [];
  let subtotal = 0;
  let totalItems = 0;

  for (const { product: productId, quantity } of items) {
    if (!productId || !quantity || quantity < 1) {
      throw new Error("Invalid item in cart");
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      throw new Error(`Product ${productId} is no longer available`);
    }

    if (product.stock < quantity) {
      throw new Error(`Insufficient stock for "${product.name}"`);
    }

    resolvedItems.push({
      product: product._id.toString(),
      quantity,
      price: product.salePrice, // authoritative price — never from the client
    });

    subtotal += product.salePrice * quantity;
    totalItems += quantity;
  }

  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  let discount = 0;
  let validatedCouponCode = "";

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: String(couponCode).toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      throw new Error("Invalid coupon");
    }

    if (new Date() > coupon.expiresAt) {
      throw new Error("Coupon expired");
    }

    if (subtotal < coupon.minimumOrderAmount) {
      throw new Error("Minimum order amount not reached for this coupon");
    }

    discount = Math.round((subtotal * coupon.discountPercentage) / 100);
    validatedCouponCode = coupon.code;
  }

  const totalAmount = Math.max(subtotal + shipping - discount, 0);

  return {
    items: resolvedItems,
    totalItems,
    subtotal,
    shipping,
    discount,
    couponCode: validatedCouponCode,
    totalAmount,
  };
};

// fires confirmation + admin alert emails, doesn't block the response
const sendOrderEmails = async (order: any) => {
  try {
    const user = await User.findById(order.user);
    const address = await Address.findById(order.shippingAddress);

    if (!user || !address) return;

    const itemsWithNames = await Promise.all(
      order.items.map(async (item: any) => {
        const product = await Product.findById(item.product).select("name");
        return {
          name: product?.name || "Saree",
          quantity: item.quantity,
          price: item.price,
        };
      })
    );

    const addressString = `${address.addressLine1}${
      address.addressLine2 ? ", " + address.addressLine2 : ""
    }, ${address.city}, ${address.state} – ${address.postalCode}`;

    await sendOrderConfirmationEmail({
      to: user.email,
      customerName: user.name,
      orderId: order._id.toString(),
      items: itemsWithNames,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      address: addressString,
    });

    await sendAdminOrderAlert({
      orderId: order._id.toString(),
      customerName: user.name,
      customerEmail: user.email,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      itemCount: order.totalItems,
    });
  } catch (err: any) {
    console.error("Order email sending failed:", err.message);
  }
};

// client only sends cart items + coupon code here, never a price —
// the amount charged is worked out server-side
export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { items, couponCode } = req.body;

    const totals = await calculateOrderTotals(items, couponCode);

    if (totals.totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid order amount" });
    }

    const options = {
      amount: Math.round(totals.totalAmount * 100), // INR → paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order: razorpayOrder,
      breakdown: totals,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// called after Razorpay checkout completes
export const verifyPaymentAndCreateOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      couponCode,
      shippingAddress,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "Payment details missing",
      });
    }

    // if this order was already verified (e.g. a retried request), just
    // return the existing order instead of creating a duplicate
    const existingOrder = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order: existingOrder,
      });
    }

    // confirms this payment actually came from Razorpay and wasn't forged
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // double check: recompute the total again and compare it against what
    // Razorpay actually charged, in case the cart changed in between
    const totals = await calculateOrderTotals(items, couponCode);

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const paidAmountRupees = Number(razorpayOrder.amount) / 100;

    if (Math.round(paidAmountRupees) !== Math.round(totals.totalAmount)) {
      console.error(
        `Payment amount mismatch for order ${razorpay_order_id}: paid ₹${paidAmountRupees}, expected ₹${totals.totalAmount}`
      );
      return res.status(400).json({
        message:
          "Payment amount does not match order total. Please contact support with your payment ID.",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    const address = await Address.findOne({
      _id: shippingAddress,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // save the order using our own computed totals, not the client's
    const newOrder = await Order.create({
      user: userId,
      items: totals.items,
      shippingAddress: address._id,
      totalItems: totals.totalItems,
      totalAmount: totals.totalAmount,
      couponCode: totals.couponCode,
      discountAmount: totals.discount,
      paymentMethod: "ONLINE",
      paymentStatus: "paid",
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      orderStatus: "confirmed",
    });

    // reduce stock for each item ordered
    for (const item of newOrder.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // fire off the confirmation + admin emails
    sendOrderEmails(newOrder);

    return res.status(201).json({
      success: true,
      message: "Payment verified & order created",
      order: newOrder,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// COD checkout
export const createCODOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { items, couponCode, shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    const address = await Address.findOne({
      _id: shippingAddress,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // same price recalculation as the online-payment flow — a tampered
    // COD order costs just as much as a tampered online one
    const totals = await calculateOrderTotals(items, couponCode);

    const order = await Order.create({
      user: userId,
      items: totals.items,
      shippingAddress: address._id,
      totalItems: totals.totalItems,
      totalAmount: totals.totalAmount,
      couponCode: totals.couponCode,
      discountAmount: totals.discount,
      paymentMethod: "COD",
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    // reduce stock for each item ordered
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // fire off the confirmation + admin emails
    sendOrderEmails(order);

    return res.status(201).json({
      success: true,
      message: "COD order placed successfully",
      order,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
