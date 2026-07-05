import { Request, Response } from "express";
import { Cart } from "../models/Cart";
import { Product } from "../models/Product";

const calculateCartTotals = (cart: any) => {
  cart.totalItems = cart.items.reduce(
    (acc: number, item: any) => acc + item.quantity,
    0
  );

  cart.totalAmount = cart.items.reduce(
    (acc: number, item: any) =>
      acc + item.quantity * item.price,
    0
  );
};

export const addToCart = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId
    );

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} unit(s) of "${product.name}" left in stock`,
      });
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        price: product.salePrice,
      });
    }

    calculateCartTotals(cart);

    await cart.save();

    return res.status(200).json(cart);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getCart = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const cart = await Cart.findOne({
      user: userId,
    })
      .populate("items.product")
      .lean();

    if (!cart) {
      return res.status(200).json({
        items: [],
        totalItems: 0,
        totalAmount: 0,
      });
    }

    return res.status(200).json(cart);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateCartItem = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) =>
        item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Item not found in cart",
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1",
      });
    }

    const product = await Product.findById(productId).select("stock name");

    if (product && quantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} unit(s) of "${product.name}" left in stock`,
      });
    }

    item.quantity = quantity;

    calculateCartTotals(cart);

    await cart.save();

    return res.status(200).json(cart);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const removeCartItem = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { productId } = req.params;

    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        item.product.toString() !== productId
    );

    calculateCartTotals(cart);

    await cart.save();

    return res.status(200).json({
      message: "Item removed successfully",
      cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const clearCart = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    cart.items = [];
    cart.totalItems = 0;
    cart.totalAmount = 0;

    await cart.save();

    return res.status(200).json({
      message: "Cart cleared successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};