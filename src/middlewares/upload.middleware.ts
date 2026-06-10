import multer, { FileFilterCallback, MulterError } from "multer";
import { Request, Response, NextFunction, RequestHandler } from "express";

const storage = multer.memoryStorage();

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const createFileFilter =
  (allowedTypes: string[]) =>
  (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
      const err = new Error(
        "Invalid file type. Allowed: JPG, JPEG, PNG, WEBP",
      ) as Error & { code: string };
      err.code = "LIMIT_UNEXPECTED_FILE_TYPE";
      return cb(err);
    }
    cb(null, true);
  };

const baseUploader = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: createFileFilter(IMAGE_ALLOWED_TYPES),
});

// Wrap multer middleware so size/type errors come back as 400 JSON
// instead of bubbling up as a 500 from the global error handler.
const withUploadErrorHandler =
  (uploader: RequestHandler, label: string): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    console.log(`[upload:${label}] incoming`, {
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
    });

    uploader(req, res, (err: any) => {
      if (err) {
        console.warn(`[upload:${label}] multer error`, {
          name: err?.name,
          code: err?.code,
          message: err?.message,
        });

        let message = err.message || "Upload failed";
        if (err instanceof MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            message = "File too large. Max 5 MB.";
          } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            message = "Unexpected file field";
          }
        }

        return res.status(400).json({
          success: false,
          statusCode: 400,
          message,
        });
      }

      const f = (req as any).file as Express.Multer.File | undefined;
      console.log(`[upload:${label}] parsed`, {
        hasFile: Boolean(f),
        fieldname: f?.fieldname,
        originalname: f?.originalname,
        mimetype: f?.mimetype,
        size: f?.size,
        bodyKeys: Object.keys(req.body || {}),
      });

      next();
    });
  };

export const uploadProfileImage = withUploadErrorHandler(
  baseUploader.single("image"),
  "profile",
);

export const uploadAadhaarImage = withUploadErrorHandler(
  baseUploader.single("aadhaarImage"),
  "aadhaar",
);

export const requireAadhaarFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Aadhaar document is required",
    });
  }
  next();
};

export const uploadBusinessLogo = withUploadErrorHandler(
  baseUploader.single("logo"),
  "business-logo",
);

export const uploadPropertyPhoto = withUploadErrorHandler(
  baseUploader.single("photo"),
  "property-photo",
);

export const uploadVehiclePhotos = withUploadErrorHandler(
  baseUploader.array("photos", 5),
  "vehicle-photos",
);

export const uploadProductImage = withUploadErrorHandler(
  baseUploader.single("image"),
  "product-image",
);

export const uploadCategoryIcon = withUploadErrorHandler(
  baseUploader.single("icon"),
  "category-icon",
);

export const requireCategoryIcon = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Category icon is required",
    });
  }
  next();
};

export const uploadSubCategoryIcon = withUploadErrorHandler(
  baseUploader.single("icon"),
  "subcategory-icon",
);

export const requireSubCategoryIcon = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Subcategory icon is required",
    });
  }
  next();
};

const CSV_ALLOWED_TYPES = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
  "application/octet-stream",
];

// Some platforms send unhelpful mimetypes for CSV. Fall back to the file
// extension when the mimetype is generic.
const csvFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const mime = file.mimetype.toLowerCase();
  const looksCsvByName = file.originalname.toLowerCase().endsWith(".csv");
  if (CSV_ALLOWED_TYPES.includes(mime) || looksCsvByName) {
    return cb(null, true);
  }
  const err = new Error(
    "Invalid file type. Upload a .csv file."
  ) as Error & { code: string };
  err.code = "LIMIT_UNEXPECTED_FILE_TYPE";
  return cb(err);
};

const csvUploader = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: csvFileFilter,
});

export const uploadProductsCsv = withUploadErrorHandler(
  csvUploader.single("csv"),
  "products-csv"
);
