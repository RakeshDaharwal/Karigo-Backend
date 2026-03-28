import { ulid } from "ulid";
import prisma from "../../../config/db.conn";
import { findCategoryById } from "../../categories/repository/repository";
import { uploadToGCP } from "../../../utils/gcp.utils";
import { getGeoCode } from "../../../utils/maps.utils";
import { UploadProfileInput } from "../validation/user.validation";

export const editUserProfileService = async (
  userId: string,
  body: UploadProfileInput,
  file?: Express.Multer.File
) => {

  // 1. Get existing user
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  let imageUrl: string | undefined = existingUser.profileImage ?? undefined;

  // 2. Upload image ONLY if new file
  if (file) {
    const fileName = `profile/${userId}-${file.originalname}`;
    imageUrl = await uploadToGCP(file, fileName);
  }


  // 3. Check if address changed
  const isAddressChanged =
    body.branch !== existingUser.branch ||
    body.district !== existingUser.district ||
    body.state !== existingUser.state ||
    body.country !== existingUser.country;

  let latitude = existingUser.latitude;
  let longitude = existingUser.longitude;

  if (isAddressChanged) {
    const fullAddress = `${body.branch}, ${body.district}, ${body.state}, ${body.country}`;

    try {
      const geo = await getGeoCode(fullAddress);

      latitude = geo.latitude;
      longitude = geo.longitude;
    } catch (error: any) {
      if (error?.message === "No results from Google Geocoder") {
        const customError = new Error("Invalid address, location not found") as Error & {
          statusCode: number;
        };
        customError.statusCode = 400;
        throw customError;
      }
      throw error;
    }
  }

  let nextDateOfBirth = existingUser.dateOfBirth;
  if (body.dateOfBirth !== undefined && body.dateOfBirth !== null) {
    const trimmed = String(body.dateOfBirth).trim();
    if (trimmed) {
      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) {
        const invalidDob = new Error("Invalid date of birth") as Error & { statusCode: number };
        invalidDob.statusCode = 400;
        throw invalidDob;
      }
      nextDateOfBirth = parsed;
    }
  }

  // 4. Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      gender: body.gender,
      dateOfBirth: nextDateOfBirth,
      country: body.country,
      state: body.state,
      district: body.district,
      branch: body.branch,
      latitude,
      longitude,
      profileImage: imageUrl,
      isProfileCompleted: true,
    },
  });

  return updatedUser;
};

export const joinKarigoProfessionalService = async (
  userId: string,
  categoryId: string,
  subCategoryIds: string[],
  file?: Express.Multer.File
) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!dbUser) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const pending = await prisma.worker.findFirst({
    where: { userId, status: "PENDING" },
  });
  if (pending) {
    const err = new Error(
      "You already have a pending professional application"
    ) as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  const category = await findCategoryById(categoryId);
  if (!category) {
    const err = new Error("Category not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const uniqueIds = [...new Set(subCategoryIds)];
  const subs = await prisma.subCategory.findMany({
    where: {
      id: { in: uniqueIds },
      categoryId,
      deletedAt: null,
    },
  });

  if (subs.length !== uniqueIds.length) {
    const err = new Error(
      "One or more skills are invalid for this category"
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  let aadhaarImageUrl: string | null = null;
  if (file) {
    const fileName = `aadhaar/${userId}-${file.originalname}`;
    aadhaarImageUrl = await uploadToGCP(file, fileName);
  }

  return prisma.worker.create({
    data: {
      id: ulid(),
      userId,
      mobile: dbUser.mobile,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      gender: dbUser.gender,
      dateOfBirth: dbUser.dateOfBirth,
      country: dbUser.country,
      state: dbUser.state,
      district: dbUser.district,
      branch: dbUser.branch,
      latitude: dbUser.latitude,
      longitude: dbUser.longitude,
      profileImage: dbUser.profileImage,
      categoryId,
      aadhaarImageUrl,
      subCategoryIds: uniqueIds,
      status: "PENDING",
    },
    include: {
      category: true,
    },
  });
};
