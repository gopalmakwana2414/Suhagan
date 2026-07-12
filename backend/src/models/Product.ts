import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;

  shortDescription: string;
  description: string;

  category: mongoose.Types.ObjectId;

  sku: string;

  originalPrice: number;
  salePrice: number;

  stock: number;

  fabric: string;
  color: string;
  occasion: string;

  blouseIncluded: boolean;

  thumbnail: {
    url: string;
    public_id: string;
  };

  images: {
    url: string;
    public_id: string;
  }[];

  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;

  averageRating: number;
  numReviews: number;

  isActive: boolean;

  metaTitle: string;
  metaDescription: string;

  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      required: true,
      maxlength: 300,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    salePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    fabric: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      default: "",
    },

    occasion: {
      type: String,
      default: "",
    },

    blouseIncluded: {
      type: Boolean,
      default: false,
    },

    thumbnail: {
      url: {
        type: String,
        default: "",
      },
      public_id: {
        type: String,
        default: "",
      },
    },

    images: [
      {
        url: {
          type: String,
          default: "",
        },
        public_id: {
          type: String,
          default: "",
        },
      },
    ],

    featured: {
      type: Boolean,
      default: false,
    },

    bestseller: {
      type: Boolean,
      default: false,
    },

    newArrival: {
      type: Boolean,
      default: true,
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    numReviews: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    metaTitle: {
      type: String,
      default: "",
    },

    metaDescription: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index(
  {
    name: "text",
    sku: "text",
    shortDescription: "text",
    fabric: "text",
    color: "text",
    occasion: "text",
  },
  {
    weights: {
      name: 10,
      sku: 8,
      shortDescription: 5,
      fabric: 3,
      color: 2,
      occasion: 2,
    },
    name: "ProductTextIndex",
  }
);
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ bestseller: 1 });
productSchema.index({ newArrival: 1 });

export const Product = mongoose.model<IProduct>(
  "Product",
  productSchema
);