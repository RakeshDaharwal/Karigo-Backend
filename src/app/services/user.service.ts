import { ulid } from "ulid";
import prisma from "../../config/db.conn";
import { findCategoryById } from "../../repositories/category.repository";
import { uploadImageBuffer } from "../../utils/cloudinary.utils";
import { UpdateBranchInput, UploadProfileInput } from "../validation/user.validation";

const branchCoordsFromDetails = (details: unknown) => {
  if (!details || typeof details !== "object") {
    return { latitude: null as number | null, longitude: null as number | null };
  }
  const obj = details as Record<string, unknown>;
  const lat = typeof obj.latitude === "number" ? obj.latitude : null;
  const lng = typeof obj.longitude === "number" ? obj.longitude : null;
  return { latitude: lat, longitude: lng };
};

export const editUserProfileService = async (
  userId: string,
  body: UploadProfileInput,
  file?: Express.Multer.File
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  let imageUrl: string | undefined = existingUser.profileImage ?? undefined;

  console.log("[users.service] editUserProfile", {
    userId,
    hasFile: Boolean(file),
    fileSize: file?.size,
    fileMime: file?.mimetype,
    bufferBytes: file?.buffer?.length,
    existingImage: existingUser.profileImage,
  });

  if (file) {
    const uploaded = await uploadImageBuffer(
      file.buffer,
      "users/profiles",
      `user_${userId}`,
    );
    imageUrl = uploaded.url;
    console.log("[users.service] profile image uploaded", { userId, url: imageUrl });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth ?? null,
      profileImage: imageUrl,
      isProfileCompleted: true,
    },
  });

  return updatedUser;
};

export const updateUserBranchService = async (userId: string, body: UpdateBranchInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      branchDetails: {
        name: body.name,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    },
  });
};

export const getMyProfessionalProfileService = async (userId: string) => {
  const worker = await prisma.worker.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  if (!worker) {
    return null;
  }

  return {
    id: worker.id,
    status: worker.status,
    category: { id: worker.category.id, name: worker.category.name },
    experienceYears: worker.experienceYears,
    aadhaarImageUrl: worker.aadhaarImageUrl,
    profileImage: worker.profileImage,
    createdAt: worker.createdAt,
  };
};

export const joinKarigoProfessionalService = async (
  userId: string,
  categoryId: string,
  experienceYears: number,
  file: Express.Multer.File
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

  const { latitude: branchLat, longitude: branchLng } = branchCoordsFromDetails(
    dbUser.branchDetails
  );
  if (branchLat == null || branchLng == null) {
    const err = new Error(
      "Please select your branch before submitting"
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const category = await findCategoryById(categoryId);
  if (!category) {
    const err = new Error("Category not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  console.log("[users.service] joinKarigoProfessional", {
    userId,
    fileSize: file.size,
    fileMime: file.mimetype,
    bufferBytes: file.buffer?.length,
  });

  const workerScopeId = ulid();
  const uploaded = await uploadImageBuffer(
    file.buffer,
    "workers/aadhaar",
    `worker_${userId}_${workerScopeId}`,
  );
  const aadhaarImageUrl = uploaded.url;
  console.log("[users.service] aadhaar uploaded", { userId, url: aadhaarImageUrl });

  const branchDetails = dbUser.branchDetails;
  const branchName =
    branchDetails &&
    typeof branchDetails === "object" &&
    "name" in branchDetails &&
    typeof (branchDetails as Record<string, unknown>).name === "string"
      ? String((branchDetails as Record<string, unknown>).name)
      : null;

  return prisma.worker.create({
    data: {
      id: ulid(),
      userId,
      mobile: dbUser.mobile,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      gender: dbUser.gender,
      dateOfBirth: dbUser.dateOfBirth,
      branch: branchName,
      latitude: branchLat,
      longitude: branchLng,
      profileImage: dbUser.profileImage ?? null,
      categoryId,
      aadhaarImageUrl,
      subCategoryIds: [],
      experienceYears,
      status: "PENDING",
    },
    include: {
      category: true,
    },
  });
};
