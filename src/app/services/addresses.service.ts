import { ulid } from "ulid";
import {
  createUserAddress,
  deleteUserAddress,
  findUserAddressById,
  listUserAddresses,
} from "../../repositories/address.repository";
import { AddressType } from "../../generated/prisma/enums";
import { CreateAddressInput } from "../validation/addresses.validation";

export const createAddressService = async (
  userId: string,
  body: CreateAddressInput
) => {
  const created = await createUserAddress({
    id: ulid(),
    userId,
    name: body.name,
    contactNumber: body.contactNumber,
    houseNo: body.houseNo ?? null,
    addressLine: body.addressLine,
    addressType: body.addressType as AddressType,
  });
  return created;
};

export const listAddressesService = (userId: string) =>
  listUserAddresses(userId);

export const deleteAddressService = async (userId: string, id: string) => {
  const existing = await findUserAddressById(id, userId);
  if (!existing) {
    const err = new Error("Address not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  await deleteUserAddress(id, userId);
  return { id };
};
