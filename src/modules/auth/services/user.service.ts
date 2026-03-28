import prisma from "../../../config/db.conn";
import { uploadToGCP } from "../../../utils/gcp.utils";
import { getGeoCode } from "../../../utils/maps.utils";
import { v4 as uuidv4 } from "uuid";
import { UploadProfileInput } from "../validation/user.validation";

export const editUserProfileService = async (
  userId: number,
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
    const fileName = `profile/${uuidv4()}-${file.originalname}`;
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

  // 4. Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth
        ? new Date(body.dateOfBirth)
        : existingUser.dateOfBirth,
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