import prisma from "../../../config/db.conn";
import { uploadToGCP } from "../../../utils/gcp.utils";
import { getGeolocation } from "../../../utils/maps.utils";
import { UpdateProfileInput } from "../validation/user.validation";

const createError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

export const updateUserProfileService = async (
  userId: number,
  body: UpdateProfileInput,
  file?: Express.Multer.File
) => {
  let imageUrl: string | undefined;

  if (file) {
    imageUrl = await uploadToGCP(file);
  }

console.log('imageUrl', imageUrl)


  const fullAddress = `${body.branch}, ${body.district}, ${body.state}, ${body.country}`;

  let latitude: number;
  let longitude: number;
  try {
    const geo = await getGeolocation(fullAddress);
    latitude = geo.latitude;
    longitude = geo.longitude;
  } catch (error: any) {
    if (error?.message === "No results from Google Geocoder") {
      throw createError("Invalid address, location not found", 400);
    }
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      country: body.country,
      state: body.state,
      district: body.district,
      branch: body.branch,
      latitude,
      longitude,
      ...(imageUrl ? { profileImage: imageUrl } : {}),
      isProfileCompleted: true,
    },
  });

  return updatedUser;
};