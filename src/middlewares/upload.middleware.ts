import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

// ================================
// STORAGE (in-memory)
// ================================
const storage = multer.memoryStorage();

// ================================
// CONSTANTS
// ================================
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const PROFILE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const AADHAAR_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
];

// ================================
// GENERIC FILE FILTER CREATOR
// ================================
const createFileFilter =
  (allowedTypes: string[]) =>
  (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          `Invalid file type. Allowed: ${allowedTypes.join(", ")}`
        )
      );
    }
    cb(null, true);
  };

// ================================
// MULTER INSTANCES
// ================================

// Profile image uploader
const profileUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: createFileFilter(PROFILE_ALLOWED_TYPES),
});

// Aadhaar image uploader (stricter)
const aadhaarUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: createFileFilter(AADHAAR_ALLOWED_TYPES),
});

// ================================
// EXPORTED MIDDLEWARES
// ================================

// Single file upload (profile)
export const uploadProfileImage = profileUpload.single("image");

// Single file upload (aadhaar)
export const uploadAadhaarImage = aadhaarUpload.single("aadhaarImage");
