import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth";

import { Review } from "../models/Review";
import { Product } from "../models/Product";



// create review
export const createReview = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { productId } = req.params;

    const { rating, comment } = req.body;

    const existingReview = await Review.findOne({
      user: req.user!._id,
      product: productId,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      user: req.user!._id,
      product: productId,
      rating,
      comment,
    });

    await updateProductRatings(productId);

    const populated = await Review.findById(review._id).populate("user", "name");

    return res.status(201).json(populated);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};



// get product reviews
export const getProductReviews = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json(reviews);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};



// delete review (user or admin)
export const deleteReview = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    // Allow admin OR the review owner to delete
    const isOwner = review.user.toString() === req.user!._id.toString();
    const isUserCustomer = req.user!.role === "customer" || req.user!.role === "user";
    const isJwtCustomer = req.jwtPayload?.role === "customer" || req.jwtPayload?.role === "user";
    const isCustomer = isUserCustomer && isJwtCustomer;

    const isUserAdmin = req.user!.role === "admin";
    const isJwtAdmin = req.jwtPayload?.role === "admin";
    const isAdmin = isUserAdmin && isJwtAdmin;

    if (!((isOwner && isCustomer) || isAdmin)) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const productId = review.product.toString();

    await review.deleteOne();

    await updateProductRatings(productId);

    return res.status(200).json({
      success: true,
      message: "Review deleted",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};



// update product rating
const updateProductRatings = async (productId: string) => {
  // let MongoDB compute the average/count instead of pulling every
  // review into Node just to reduce() over them — same result, but
  // doesn't get slower as a product's review count grows
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats ? Math.round(stats.averageRating * 10) / 10 : 0,
    numReviews: stats ? stats.numReviews : 0,
  });
};
