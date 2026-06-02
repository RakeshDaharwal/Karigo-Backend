import prisma from "../config/db.conn";
import { AddressType } from "../generated/prisma/enums";

export type CreateAddressData = {
  id: string;
  userId: string;
  name: string;
  contactNumber: string;
  houseNo?: string | null;
  addressLine: string;
  addressType: AddressType;
};

export const createUserAddress = (data: CreateAddressData) =>
  prisma.userAddress.create({ data });

export const listUserAddresses = (userId: string) =>
  prisma.userAddress.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

export const findUserAddressById = (id: string, userId: string) =>
  prisma.userAddress.findFirst({ where: { id, userId } });

export const deleteUserAddress = (id: string, userId: string) =>
  prisma.userAddress.deleteMany({ where: { id, userId } });
