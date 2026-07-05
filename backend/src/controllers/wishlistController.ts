import { Request, Response } from "express";
import { Wishlist } from "../models/Wishlist";
import { Product } from "../models/Product";

// add a product to the logged-in user's wishlist
export const addToWishlist = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { productId } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    let wishlist = await Wishlist.findOne({
      user: userId,
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        products: [],
      });
    }

    const alreadyExists =
      wishlist.products.includes(productId);

    if (alreadyExists) {
      return res.status(400).json({
        message: "Product already in wishlist",
      });
    }

    wishlist.products.push(product._id);

    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Added to wishlist",
      wishlist,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// used on the wishlist page
export const getWishlist = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const wishlist = await Wishlist.findOne({
      user: userId,
    }).populate("products").lean();

    if (!wishlist) {
      return res.status(200).json({
        products: [],
      });
    }

    return res.status(200).json(wishlist);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// remove one product from the wishlist
export const removeFromWishlist = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({
      user: userId,
    });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found",
      });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId
    );

    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Removed from wishlist",
      wishlist,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};