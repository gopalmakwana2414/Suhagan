import { Request, Response } from "express";
import { Coupon } from "../models/Coupon";



// CREATE COUPON
export const createCoupon = async (
  req: Request,
  res: Response
) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const normalizedCode = code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      ...req.body,
      code: normalizedCode,
    });

    return res.status(201).json(coupon);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};



// GET ALL COUPONS
export const getCoupons = async (
  req: Request,
  res: Response
) => {
  try {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(coupons);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};



// APPLY COUPON
export const applyCoupon = async (
  req: Request,
  res: Response
) => {
  try {
    const { code, orderAmount } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        message: "Invalid coupon",
      });
    }

    if (new Date() > coupon.expiresAt) {
      return res.status(400).json({
        message: "Coupon expired",
      });
    }

    if (
      coupon.usageLimit &&
      coupon.usedCount !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        message: "Coupon usage limit reached",
      });
    }

    if (
      orderAmount <
      coupon.minimumOrderAmount
    ) {
      return res.status(400).json({
        message:
          "Minimum order amount not reached",
      });
    }

    const discount =
      (orderAmount *
        coupon.discountPercentage) /
      100;

    const finalAmount =
      orderAmount - discount;

    return res.status(200).json({
      success: true,

      coupon: coupon.code,

      discountPercentage:
        coupon.discountPercentage,

      discount,

      finalAmount,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};



// UPDATE COUPON
export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, discountPercentage, minimumOrderAmount, expiresAt, isActive, usageLimit } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (code && code.toUpperCase().trim() !== coupon.code) {
      const duplicateCode = await Coupon.findOne({ code: code.toUpperCase().trim() });
      if (duplicateCode) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }
      coupon.code = code.toUpperCase().trim();
    }

    if (discountPercentage !== undefined) {
      if (discountPercentage < 1 || discountPercentage > 100) {
        return res.status(400).json({ message: "Discount percentage must be between 1 and 100" });
      }
      coupon.discountPercentage = discountPercentage;
    }

    if (minimumOrderAmount !== undefined) {
      if (minimumOrderAmount < 0) {
        return res.status(400).json({ message: "Minimum order amount cannot be negative" });
      }
      coupon.minimumOrderAmount = minimumOrderAmount;
    }

    if (expiresAt !== undefined) {
      coupon.expiresAt = new Date(expiresAt);
    }

    if (isActive !== undefined) {
      coupon.isActive = isActive;
    }

    if (usageLimit !== undefined) {
      coupon.usageLimit = usageLimit === "" || usageLimit === null ? undefined : Number(usageLimit);
    }

    await coupon.save();
    return res.status(200).json(coupon);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};



// DELETE COUPON
export const deleteCoupon = async (
  req: Request,
  res: Response
) => {
  try {
    await Coupon.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Coupon deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};