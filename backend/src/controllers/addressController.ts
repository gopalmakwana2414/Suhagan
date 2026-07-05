import { Request, Response } from "express";
import { Address } from "../models/Address";

// create address
export const createAddress = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const {
      fullName,
      mobileNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      isDefault,
    } = req.body;

    if (isDefault) {
      await Address.updateMany(
        { user: userId },
        { isDefault: false }
      );
    }

    const address = await Address.create({
      user: userId,
      fullName,
      mobileNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      isDefault,
    });

    return res.status(201).json(address);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// get all addresses
export const getAddresses = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const addresses = await Address.find({
      user: userId,
    }).sort({ isDefault: -1 });

    return res.status(200).json(addresses);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// update address
export const updateAddress = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const address = await Address.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    if (req.body.isDefault) {
      await Address.updateMany(
        { user: userId },
        { isDefault: false }
      );
    }

    const updatedAddress =
      await Address.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    return res.status(200).json(updatedAddress);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// set default address
export const setDefaultAddress = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const address = await Address.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    await Address.updateMany(
      { user: userId },
      { isDefault: false }
    );

    address.isDefault = true;

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated",
      address,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// delete address
export const deleteAddress = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const address = await Address.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    await Address.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};