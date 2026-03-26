import prisma from "../../../config/db.conn";
import { uploadToGCP } from "../../../utils/gcp.utils";
import { getGeoCode } from "../../../utils/maps.utils";
import { v4 as uuidv4 } from "uuid";
import { UploadProfileInput } from "../validation/user.validation";

export const uploadUserProfileService = async (
  userId: number,
  body: UploadProfileInput,
  file?: Express.Multer.File
) => {
  let imageUrl: string | undefined;

  if (file) {
    const fileName = `profile/${uuidv4()}-${file.originalname}`;
    imageUrl = await uploadToGCP(file, fileName);
  }

console.log('imageUrl', imageUrl)


  const fullAddress = `${body.branch}, ${body.district}, ${body.state}, ${body.country}`;

  let latitude: number;
  let longitude: number;
  try {
    const geo = await getGeoCode(fullAddress);


console.log('geo', geo)
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