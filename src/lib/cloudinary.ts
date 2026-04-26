import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  file: string,
  folder = "car-marketplace"
): Promise<string> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    transformation: [
      { width: 1200, height: 800, crop: "fill", gravity: "auto" },
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ],
  });
  return result.secure_url;
}

export async function uploadImages(
  files: string[],
  folder = "car-marketplace"
): Promise<string[]> {
  const uploads = await Promise.all(files.map((f) => uploadImage(f, folder)));
  return uploads;
}

export async function deleteImage(url: string): Promise<void> {
  // Extract public_id from Cloudinary URL
  const parts = url.split("/");
  const folderAndFile = parts.slice(-2).join("/");
  const publicId = folderAndFile.split(".")[0];
  await cloudinary.uploader.destroy(publicId);
}
