import prisma from "../config/db.conn";

export type CreateStoreData = {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
};

export const createStore = (data: CreateStoreData) =>
  prisma.store.create({ data });

export const findStoreById = (storeId: string) =>
  prisma.store.findUnique({ where: { id: storeId } });

export const listStoresByUserWithCounts = (userId: string) =>
  prisma.store.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

export const findStoreOwned = (storeId: string, userId: string) =>
  prisma.store.findFirst({ where: { id: storeId, userId } });
