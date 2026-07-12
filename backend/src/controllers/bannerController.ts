import { Request, Response } from "express";
import { Banner } from "../models/Banner";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinaryService";

// create banner
export const createBanner = async (req: Request, res: Response) => {
  try {
    const { title, subtitle, link, buttonText, position, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Banner image is required" });
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "kaumudi/banners"
    );

    const banner = await Banner.create({
      title,
      subtitle,
      link,
      buttonText,
      position: position || "hero",
      order: order ? Number(order) : 0,
      image: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
    });

    return res.status(201).json(banner);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// get all banners (admin — all, including inactive)
export const getAllBannersAdmin = async (req: Request, res: Response) => {
  try {
    const banners = await Banner.find().sort({ position: 1, order: 1 });
    return res.status(200).json(banners);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// get active banners (public — for homepage)
export const getActiveBanners = async (req: Request, res: Response) => {
  try {
    const { position } = req.query;

    const filter: any = { isActive: true };
    if (position) filter.position = position;

    const banners = await Banner.find(filter).sort({ order: 1 }).lean();

    // this is the homepage hero endpoint — every visitor hits it, and
    // banners only change when an admin edits one, so cache it briefly
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.status(200).json(banners);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// update banner — replace image and/or edit fields
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const { title, subtitle, link, buttonText, position, order } = req.body;

    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (link !== undefined) banner.link = link;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (position !== undefined) banner.position = position;
    if (order !== undefined) banner.order = Number(order);

    // A new image was uploaded — replace it. Upload the new one first,
    // then delete the old Cloudinary asset only after the new upload
    // succeeds, so a failed upload never leaves the banner with no image.
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "kaumudi/banners"
      );

      const oldPublicId = banner.image?.publicId;

      banner.image = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };

      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId).catch(() => {});
      }
    }

    await banner.save();

    return res.status(200).json(banner);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// toggle banner active status
export const toggleBannerStatus = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    return res.status(200).json(banner);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// delete banner
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (banner.image?.publicId) {
      await deleteFromCloudinary(banner.image.publicId).catch(() => {});
    }

    await banner.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
