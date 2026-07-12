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
import { generateInvoicePDFBuffer } from "../services/invoiceService";

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 99;

// recalculates the cart total from the DB every time instead of trusting
// whatever price the client sends — otherwise someone could just edit the
// request and pay ₹1 for a ₹50,000 order
const calculateOrderTotals = async (
  items: { product: string; quantity: number }[],
  couponCode?: string,
  ignoreStockCheck: boolean = false
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

    if (!ignoreStockCheck && product.stock < quantity) {
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
      code: String(couponCode).toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      throw new Error("Invalid coupon");
    }

    if (new Date() > coupon.expiresAt) {
      throw new Error("Coupon expired");
    }

    if (
      coupon.usageLimit &&
      coupon.usedCount !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      throw new Error("Coupon usage limit reached");
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
    // Fetch populated order to check if invoice was already sent and get all info
    const populatedOrder = await Order.findById(order._id)
      .populate("shippingAddress")
      .populate("items.product", "name sku thumbnail originalPrice salePrice")
      .populate("user", "name email");

    if (!populatedOrder) {
      console.error(`Order ${order._id} not found for sending emails`);
      return;
    }

    if (populatedOrder.invoiceSent) {
      console.log(`Invoice already sent for order ${populatedOrder._id}`);
      return;
    }

    const user = populatedOrder.user as any;
    const address = populatedOrder.shippingAddress as any;

    if (!user || !address) {
      console.error(`Missing user or address for order ${populatedOrder._id}`);
      return;
    }

    // Generate PDF Buffer
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateInvoicePDFBuffer(populatedOrder as any);
    } catch (pdfErr: any) {
      console.error(`PDF generation failed for order ${populatedOrder._id}:`, pdfErr.message);
      return; // do not proceed to email if attachment failed
    }

    // Format address & items for the email template
    const addressString = `${address.fullName}\n${address.addressLine1}${
      address.addressLine2 ? ", " + address.addressLine2 : ""
    }\n${address.city}, ${address.state} - ${address.postalCode}\n${address.country}\nPhone: ${address.mobileNumber}`;

    const itemsForEmail = populatedOrder.items.map((item: any) => ({
      name: item.product?.name || "Saree Product",
      quantity: item.quantity,
      price: item.price,
    }));

    // Send customer confirmation email with PDF attachment
    try {
      await sendOrderConfirmationEmail({
        to: user.email,
        customerName: user.name,
        orderId: populatedOrder._id.toString(),
        orderDate: populatedOrder.createdAt,
        items: itemsForEmail,
        totalAmount: populatedOrder.totalAmount,
        paymentMethod: populatedOrder.paymentMethod,
        paymentStatus: populatedOrder.paymentStatus,
        address: addressString,
        pdfBuffer,
      });
      
      // Mark as sent and save
      populatedOrder.invoiceSent = true;
      await populatedOrder.save();
    } catch (emailErr: any) {
      console.error(`Customer confirmation email failed for order ${populatedOrder._id}:`, emailErr.message);
    }

    // Send admin alert (keep separate so customer failures don't block admin alert)
    try {
      await sendAdminOrderAlert({
        orderId: populatedOrder._id.toString(),
        customerName: user.name,
        customerEmail: user.email,
        totalAmount: populatedOrder.totalAmount,
        paymentMethod: populatedOrder.paymentMethod,
        itemCount: populatedOrder.totalItems,
      });
    } catch (adminErr: any) {
      console.error(`Admin order alert email failed for order ${populatedOrder._id}:`, adminErr.message);
    }
  } catch (err: any) {
    console.error(`Error in sendOrderEmails background runner for order ${order._id}:`, err.message);
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
    // Razorpay actually charged, in case the cart changed in between.
    // We pass ignoreStockCheck = true here: they have already paid, so we must
    // record their order regardless of sudden stock depletion.
    const totals = await calculateOrderTotals(items, couponCode, true);

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

    // increment coupon usage count
    if (newOrder.couponCode) {
      await Coupon.updateOne({ code: newOrder.couponCode }, { $inc: { usedCount: 1 } });
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
    // reduce stock atomically, verifying we don't oversell
    const decrementedItems: { product: string; quantity: number }[] = [];
    try {
      for (const item of order.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        if (!updatedProduct) {
          throw new Error(`Insufficient stock for one of the products`);
        }
        decrementedItems.push({ product: item.product.toString(), quantity: item.quantity });
      }
    } catch (err: any) {
      // Rollback any successfully decremented stocks
      for (const rolledBack of decrementedItems) {
        await Product.findByIdAndUpdate(rolledBack.product, {
          $inc: { stock: rolledBack.quantity },
        });
      }
      // Also delete the created order since checkout failed
      await Order.findByIdAndDelete(order._id);
      throw err;
    }

    // increment coupon usage count
    if (order.couponCode) {
      await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
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
