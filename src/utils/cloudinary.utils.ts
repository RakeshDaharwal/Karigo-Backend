import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from "cloudinary";
import { env } from "../config/env";
import { logError } from "./logger.utils";

let configured = false;

const ensureConfigured = () => {
  if (configured) {
    return;
  }
  console.log("[cloudinary] configuring", {
    cloudName: env.cloudinaryCloudName ? env.cloudinaryCloudName : "MISSING",
    apiKey: env.cloudinaryApiKey ? `${env.cloudinaryApiKey.slice(0, 4)}...` : "MISSING",
    hasSecret: Boolean(env.cloudinaryApiSecret),
    folder: env.cloudinaryUploadFolder,
  });
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    const err = new Error("Cloudinary credentials are not configured") as Error & {
      statusCode: number;
    };
    err.statusCode = 503;
    throw err;
  }
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  configured = true;
  console.log("[cloudinary] configured");
};

const buildFolder = (subfolder: string) => {
  const root = env.cloudinaryUploadFolder.replace(/^\/+|\/+$/g, "");
  const child = subfolder.replace(/^\/+|\/+$/g, "");
  return root ? `${root}/${child}` : child;
};

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
};

// Stream a file buffer to Cloudinary. publicId lets us overwrite the same asset
// (e.g. one stable filename per user/document) instead of accumulating versions.
export const uploadImageBuffer = async (
  buffer: Buffer,
  subfolder: string,
  publicId?: string,
): Promise<CloudinaryUploadResult> => {
  ensureConfigured();

  const options: UploadApiOptions = {
    folder: buildFolder(subfolder),
    resource_type: "image",
    overwrite: true,
    invalidate: true,
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  };

  if (publicId) {
    options.public_id = publicId;
  }

  console.log("[cloudinary] upload start", {
    folder: options.folder,
    publicId: options.public_id,
    bufferBytes: buffer?.length ?? 0,
  });

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          console.error("[cloudinary] upload error", {
            folder: options.folder,
            publicId: options.public_id,
            errorMessage: error?.message,
            errorName: error?.name,
            errorHttpCode: (error as any)?.http_code,
          });
          logError("Cloudinary upload failed", {
            service: "cloudinary",
            event: "UPLOAD_FAILED",
            error: error?.message || "no result",
          });
          const err = new Error(
            error?.message ? `Image upload failed: ${error.message}` : "Image upload failed",
          ) as Error & { statusCode: number };
          err.statusCode = 502;
          return reject(err);
        }
        console.log("[cloudinary] upload success", {
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          url: result.secure_url,
        });
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );
    uploadStream.end(buffer);
  });
};
