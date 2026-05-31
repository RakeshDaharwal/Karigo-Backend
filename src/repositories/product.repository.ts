import prisma from "../config/db.conn";

export type CreateProductData = {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
};

export const createProduct = (data: CreateProductData) =>
  prisma.product.create({ data });

export const createProductsBulk = (data: CreateProductData[]) =>
  prisma.product.createMany({ data, skipDuplicates: false });

export const listProductsByStore = (storeId: string) =>
  prisma.product.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });

export const findProductOwned = (productId: string, storeId: string) =>
  prisma.product.findFirst({
    where: { id: productId, storeId },
  });

export const updateProduct = (
  productId: string,
  data: {
    name?: string;
    description?: string | null;
    price?: number;
    imageUrl?: string | null;
  }
) =>
  prisma.product.update({
    where: { id: productId },
    data,
  });

export const deleteProduct = (productId: string) =>
  prisma.product.delete({ where: { id: productId } });
