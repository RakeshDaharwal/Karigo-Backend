import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  createProductService,
  createStoreService,
  deleteProductService,
  getStoreService,
  listProductsService,
  listStoresService,
  updateProductService,
} from "../services/store.service";
import {
  createProductSchema,
  createStoreSchema,
  CreateProductInput,
  CreateStoreInput,
  updateProductSchema,
  UpdateProductInput,
} from "../validation/store.validation";

const requireUserId = (req: Request) => {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (!user?.userId) {
    const err = new Error("Unauthorized") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }
  return user.userId;
};

// CSV upload uses multipart/form-data, so the multer middleware lands the
// text fields in req.body without zod validation pre-applied. Run the schema
// inline here, then dispatch to the service.
export const createStore = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);

    const parsed = createStoreSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: parsed.error.issues[0].message,
      });
    }

    const result = await createStoreService(
      userId,
      parsed.data as CreateStoreInput,
      req.file
    );

    logInfo("Store created", {
      service: "store",
      event: "CREATE_STORE_SUCCESS",
      userId,
      storeId: result.store?.id,
      importedProducts: result.importedProducts,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Store created successfully",
      data: result,
    });
  } catch (error: any) {
    logError("Store creation failed", {
      service: "store",
      event: "CREATE_STORE_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const listStores = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const data = await listStoresService(userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Stores fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("List stores failed", {
      service: "store",
      event: "LIST_STORES_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const getStore = async (
  req: Request<{ storeId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const data = await getStoreService(userId, req.params.storeId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Store fetched successfully",
      data,
    });
  } catch (error: any) {
    next(error);
  }
};

export const listProducts = async (
  req: Request<{ storeId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const data = await listProductsService(userId, req.params.storeId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Products fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("List products failed", {
      service: "store",
      event: "LIST_PRODUCTS_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

// Both create and update use multipart/form-data so the (optional) image is
// uploaded alongside the text fields. We parse the body schema inline because
// multer leaves req.body unvalidated.
export const createProduct = async (
  req: Request<{ storeId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);

    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: parsed.error.issues[0].message,
      });
    }

    const data = await createProductService(
      userId,
      req.params.storeId,
      parsed.data as CreateProductInput,
      req.file
    );

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Product created successfully",
      data,
    });
  } catch (error: any) {
    logError("Create product failed", {
      service: "store",
      event: "CREATE_PRODUCT_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const updateProduct = async (
  req: Request<{ storeId: string; productId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: parsed.error.issues[0].message,
      });
    }

    const body = parsed.data as UpdateProductInput;
    const hasAnyChange =
      body.name !== undefined ||
      body.description !== undefined ||
      body.price !== undefined ||
      body.removeImage === true ||
      Boolean(req.file);

    if (!hasAnyChange) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Provide at least one field to update",
      });
    }

    const data = await updateProductService(
      userId,
      req.params.storeId,
      req.params.productId,
      body,
      req.file
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Product updated successfully",
      data,
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request<{ storeId: string; productId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const data = await deleteProductService(
      userId,
      req.params.storeId,
      req.params.productId
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Product deleted successfully",
      data,
    });
  } catch (error: any) {
    next(error);
  }
};

