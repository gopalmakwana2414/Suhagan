import { Request, Response } from "express";
import slugify from "slugify";

import { Product } from "../models/Product";
import { Category } from "../models/Category";

import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinaryService";

// admin adds a new product
export const createProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      shortDescription,
      description,
      category,
      sku,
      originalPrice,
      salePrice,
      stock,
      fabric,
      color,
      occasion,
      blouseIncluded,
      featured,
      bestseller,
      newArrival,
      metaTitle,
      metaDescription,
    } = req.body;

    const existingSku = await Product.findOne({
      sku: sku.toUpperCase(),
    });

    if (existingSku) {
      return res.status(400).json({
        message: "SKU already exists",
      });
    }

    const slug = slugify(name, {
      lower: true,
      strict: true,
    });

    const existingSlug = await Product.findOne({
      slug,
    });

    if (existingSlug) {
      return res.status(400).json({
        message: "Product slug already exists",
      });
    }

    const categoryExists = await Category.findById(
      category
    );

    if (!categoryExists) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    if (
      Number(salePrice) >
      Number(originalPrice)
    ) {
      return res.status(400).json({
        message:
          "Sale price cannot exceed original price",
      });
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    if (!files?.thumbnail?.length) {
      return res.status(400).json({
        message: "Thumbnail is required",
      });
    }

    const thumbnailUpload =
      await uploadToCloudinary(
        files.thumbnail[0].buffer,
        "kaumudi/products/thumbnails"
      );

    const thumbnail = {
      url: thumbnailUpload.secure_url,
      public_id: thumbnailUpload.public_id,
    };

    let images: {
      url: string;
      public_id: string;
    }[] = [];

    if (files?.images?.length) {
      const uploads = await Promise.all(
        files.images.map((file) =>
          uploadToCloudinary(
            file.buffer,
            "kaumudi/products/gallery"
          )
        )
      );

      images = uploads.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));
    }

    const product = await Product.create({
      name,
      slug,

      shortDescription,
      description,

      category,

      sku: sku.toUpperCase(),

      originalPrice,
      salePrice,
      stock,

      fabric,
      color,
      occasion,

      blouseIncluded,

      thumbnail,
      images,

      featured,
      bestseller,
      newArrival,

      metaTitle,
      metaDescription,
    });

    const populatedProduct =
      await Product.findById(product._id).populate(
        "category",
        "name"
      );

    return res
      .status(201)
      .json(populatedProduct);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// list products for the shop page, with search/filter/sort + pagination
export const getProducts = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Number(req.query.limit) || 12,
      100
    );

    const {
      search = "",
      category,
      featured,
      bestseller,
      newArrival,
      inStock,
      sort = "latest",
      minPrice,
      maxPrice,
    } = req.query;

    const query: any = {
      isActive: true,
    };

    // text search using the compound text index (name, sku, fabric, color, occasion, shortDescription)
    if (search) {
      query.$text = { $search: String(search) };
    }

    // category can come in as either a slug or a name from the frontend
    if (category) {
      let categoryId = category;

      const categoryDoc =
        await Category.findOne({
          $or: [
            {
              slug: String(category)
                .toLowerCase(),
            },
            {
              name: {
                $regex: `^${category}$`,
                $options: "i",
              },
            },
          ],
        });

      if (categoryDoc) {
        categoryId = categoryDoc._id;
      }

      query.category = categoryId;
    }

    if (minPrice || maxPrice) {
      query.salePrice = {};

      if (minPrice) {
        query.salePrice.$gte =
          Number(minPrice);
      }

      if (maxPrice) {
        query.salePrice.$lte =
          Number(maxPrice);
      }
    }

    if (featured === "true") {
      query.featured = true;
    }

    if (bestseller === "true") {
      query.bestseller = true;
    }

    if (newArrival === "true") {
      query.newArrival = true;
    }

    if (inStock === "true") {
      query.stock = {
        $gt: 0,
      };
    }

    let sortOption: any = {
      createdAt: -1,
    };

    switch (sort) {
      case "priceLow":
        sortOption = {
          salePrice: 1,
        };
        break;

      case "priceHigh":
        sortOption = {
          salePrice: -1,
        };
        break;

      default:
        sortOption = {
          createdAt: -1,
        };
    }

    // .lean() skips hydrating full Mongoose documents since this is a
    // read-only listing — noticeably lighter on CPU/memory once traffic
    // picks up, and we don't need any of the document methods here.
    const products = await Product.find(
      query
    )
      .populate("category", "name")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalProducts =
      await Product.countDocuments(
        query
      );

    return res.status(200).json({
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.max(
        1,
        Math.ceil(
          totalProducts / limit
        )
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// single product page looks this up by slug
export const getProductBySlug = async (
  req: Request,
  res: Response
) => {
  try {
    const product =
      await Product.findOne({
        slug: req.params.slug,
        isActive: true,
      })
        .populate("category", "name")
        .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json(product);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// admin edits an existing product
export const updateProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const product =
      await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const updatedData: any = {
      ...req.body,
    };

    if (
      updatedData.salePrice &&
      updatedData.originalPrice &&
      Number(updatedData.salePrice) >
        Number(updatedData.originalPrice)
    ) {
      return res.status(400).json({
        message:
          "Sale price cannot exceed original price",
      });
    }

    if (updatedData.sku) {
      const existingSku =
        await Product.findOne({
          sku: updatedData.sku.toUpperCase(),
          _id: { $ne: product._id },
        });

      if (existingSku) {
        return res.status(400).json({
          message: "SKU already exists",
        });
      }

      updatedData.sku =
        updatedData.sku.toUpperCase();
    }

    if (updatedData.name) {
  const newSlug = slugify(
    updatedData.name,
    {
      lower: true,
      strict: true,
    }
  );

  const existingSlug =
    await Product.findOne({
      slug: newSlug,
      _id: {
        $ne: product._id,
      },
    });

  if (existingSlug) {
    return res.status(400).json({
      message:
        "Product slug already exists",
    });
  }

  updatedData.slug = newSlug;
}

    const updatedProduct =
      await Product.findByIdAndUpdate(
        req.params.id,
        updatedData,
        {
          new: true,
          runValidators: true,
        }
      ).populate("category", "name");

    return res
      .status(200)
      .json(updatedProduct);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// admin deletes a product (and its cloudinary images)
export const deleteProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const product =
      await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Collect every Cloudinary asset tied to this product,
    // filtering out any entries with a missing/empty public_id
    // (e.g. legacy/seed data or a partially-failed upload) so we
    // never call cloudinary.uploader.destroy("") — that call
    // throws "Missing required parameter - public_id" and was
    // the root cause of delete failing entirely.
    const publicIdsToDelete = [
      product.thumbnail?.public_id,
      ...(product.images?.map((img) => img.public_id) || []),
    ].filter((publicId): publicId is string => Boolean(publicId));

    if (publicIdsToDelete.length) {
      // Use allSettled instead of all: a single failed/expired
      // Cloudinary asset should not prevent the product record
      // from being deleted. Failures are logged for cleanup but
      // never block the response.
      const results = await Promise.allSettled(
        publicIdsToDelete.map((publicId) =>
          deleteFromCloudinary(publicId)
        )
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to delete Cloudinary asset ${publicIdsToDelete[index]} for product ${req.params.id}:`,
            result.reason
          );
        }
      });
    }

    await Product.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Product deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};