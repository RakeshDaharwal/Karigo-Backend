import { ulid } from "ulid";
import {
  createStore,
  findStoreOwned,
  listStoresByUserWithCounts,
} from "../../repositories/store.repository";
import {
  createProduct,
  createProductsBulk,
  deleteProduct,
  findProductOwned,
  listProductsByStore,
  updateProduct,
} from "../../repositories/product.repository";
import { findApprovedBusinessesByUserId } from "../../repositories/business.repository";
import { parseProductsCsv } from "../../utils/csv.utils";
import { uploadImageBuffer } from "../../utils/cloudinary.utils";
import {
  CreateProductInput,
  CreateStoreInput,
  UpdateProductInput,
} from "../validation/store.validation";

// Pushes a multer file to Cloudinary under a per-store folder, returns the
// secure URL. publicId stays product-scoped so re-uploads overwrite.
const uploadProductImageFile = async (
  storeId: string,
  productId: string,
  file: Express.Multer.File
) => {
  const result = await uploadImageBuffer(
    file.buffer,
    `stores/${storeId}/products`,
    `product_${productId}`
  );
  return result.url;
};

const httpError = (message: string, statusCode: number) => {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
};

const ensureStoreOwnership = async (storeId: string, userId: string) => {
  const store = await findStoreOwned(storeId, userId);
  if (!store) {
    throw httpError("Store not found", 404);
  }
  return store;
};

export const createStoreService = async (
  userId: string,
  body: CreateStoreInput,
  csvFile?: Express.Multer.File
) => {
  // Auto-link the new store to the user's approved business. If multiple
  // businesses are approved for this user we pick the most recently approved one.
  const approvedBusinesses = await findApprovedBusinessesByUserId(userId);
  const business = approvedBusinesses[0];
  if (!business) {
    throw httpError("No approved business found for this user", 404);
  }

  const storeId = ulid();

  await createStore({
    id: storeId,
    userId,
    businessId: business.id,
    name: body.name,
    description: body.description ?? null,
    openTime: body.openTime ?? null,
    closeTime: body.closeTime ?? null,
  });

  let importedProducts = 0;

  if (csvFile?.buffer && csvFile.size > 0) {
    const text = csvFile.buffer.toString("utf8");
    const rows = parseProductsCsv(text);

    if (rows.length > 0) {
      const data = rows.map((r) => ({
        id: ulid(),
        storeId,
        name: r.name,
        description: r.description || null,
        price: r.price,
      }));

      const result = await createProductsBulk(data);
      importedProducts = result.count ?? data.length;
    }
  }

  return {
    store: await findStoreOwned(storeId, userId),
    importedProducts,
  };
};

export const listStoresService = async (userId: string) => {
  const stores = await listStoresByUserWithCounts(userId);
  return stores.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    openTime: s.openTime,
    closeTime: s.closeTime,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    productCount: s._count.products,
  }));
};

export const getStoreService = async (userId: string, storeId: string) => {
  const store = await ensureStoreOwnership(storeId, userId);
  return store;
};

export const listProductsService = async (
  userId: string,
  storeId: string
) => {
  await ensureStoreOwnership(storeId, userId);
  return listProductsByStore(storeId);
};

export const createProductService = async (
  userId: string,
  storeId: string,
  body: CreateProductInput,
  imageFile?: Express.Multer.File
) => {
  await ensureStoreOwnership(storeId, userId);

  const productId = ulid();
  const imageUrl = imageFile
    ? await uploadProductImageFile(storeId, productId, imageFile)
    : null;

  return createProduct({
    id: productId,
    storeId,
    name: body.name,
    description: body.description ?? null,
    price: body.price,
    imageUrl,
  });
};

export const updateProductService = async (
  userId: string,
  storeId: string,
  productId: string,
  body: UpdateProductInput,
  imageFile?: Express.Multer.File
) => {
  await ensureStoreOwnership(storeId, userId);

  const product = await findProductOwned(productId, storeId);
  if (!product) {
    throw httpError("Product not found", 404);
  }

  const data: {
    name?: string;
    description?: string | null;
    price?: number;
    imageUrl?: string | null;
  } = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.price !== undefined) data.price = body.price;
  if (body.removeImage) data.imageUrl = null;
  if (imageFile) {
    data.imageUrl = await uploadProductImageFile(storeId, productId, imageFile);
  }

  return updateProduct(productId, data);
};

export const deleteProductService = async (
  userId: string,
  storeId: string,
  productId: string
) => {
  await ensureStoreOwnership(storeId, userId);

  const product = await findProductOwned(productId, storeId);
  if (!product) {
    throw httpError("Product not found", 404);
  }

  await deleteProduct(productId);
  return { id: productId };
};
