import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";
import { UploadApiResponse } from "cloudinary";

// upload single image
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);

        if (!result) {
          return reject(new Error("Cloudinary upload failed"));
        }

        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// delete image (new)
export const deleteFromCloudinary = async (
  public_id: string
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
    throw error;
  }
};

// upload multiple images (new)
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder: string
): Promise<{ url: string; public_id: string }[]> => {
  const uploads = files.map((file) =>
    uploadToCloudinary(file.buffer, folder).then((res) => ({
      url: res.secure_url,
      public_id: res.public_id,
    }))
  );

  return Promise.all(uploads);
};