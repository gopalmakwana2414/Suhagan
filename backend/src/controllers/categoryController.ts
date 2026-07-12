import { Request, Response } from "express";
import slugify from "slugify";
import { Category } from "../models/Category";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinaryService";

// Helper function to extract public ID from a Cloudinary URL string
const getPublicIdFromUrl = (url: string): string | null => {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    
    let publicIdWithExt = parts[1];
    // Remove version code (e.g. v123456789/) if present
    const versionMatch = publicIdWithExt.match(/^v\d+\/(.+)$/);
    if (versionMatch) {
      publicIdWithExt = versionMatch[1];
    }
    
    // Strip file extension
    const lastDotIndex = publicIdWithExt.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
    return publicIdWithExt;
  } catch (error) {
    return null;
  }
};

export const createCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, description, slug } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        message: "Category already exists",
      });
    }

    let finalSlug = slug ? slugify(slug, { lower: true }) : slugify(name, { lower: true });
    const duplicateSlug = await Category.findOne({ slug: finalSlug });
    if (duplicateSlug) {
      return res.status(400).json({ message: "Category slug already exists" });
    }

    let imageUrl = "";
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "kaumudi/categories"
      );
      imageUrl = uploadResult.secure_url;
    }

    const category = await Category.create({
      name: name.trim(),
      slug: finalSlug,
      description,
      image: imageUrl || undefined,
    });

    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getCategories = async (
  req: Request,
  res: Response
) => {
  try {
    const categories = await Category.find().lean();

    // categories barely ever change, so let browsers/CDNs cache this for
    // a minute instead of hitting the DB on every single page load —
    // this one endpoint gets called from the navbar on every page
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, slug } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name && name.trim() !== category.name) {
      const duplicateName = await Category.findOne({ name: name.trim() });
      if (duplicateName) {
        return res.status(400).json({ message: "Category name already exists" });
      }
      category.name = name.trim();
    }

    let finalSlug = slug ? slugify(slug, { lower: true }) : null;
    if (name && !slug) {
      finalSlug = slugify(name, { lower: true });
    }

    if (finalSlug && finalSlug !== category.slug) {
      const duplicateSlug = await Category.findOne({ slug: finalSlug });
      if (duplicateSlug) {
        return res.status(400).json({ message: "Category slug already exists" });
      }
      category.slug = finalSlug;
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "kaumudi/categories"
      );

      const oldImage = category.image;
      category.image = uploadResult.secure_url;

      if (oldImage) {
        const oldPublicId = getPublicIdFromUrl(oldImage);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId).catch(() => {});
        }
      }
    }

    await category.save();
    return res.status(200).json(category);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.image) {
      const publicId = getPublicIdFromUrl(category.image);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(() => {});
      }
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
