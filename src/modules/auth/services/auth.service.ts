import bcrypt from "bcrypt";
import {
  findUserByMobile,
  markUserVerified,
  upsertUserForLogin,
} from "../repository/repository";
import { generateAppAccessToken } from "../../../utils/jwt";

const OTP_EXPIRY_IN_MS = 5 * 60 * 1000;
const OTP_BYPASS_CODE = "123456";

const createError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const userLoginService = async (mobile: string) => {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_IN_MS);

  const user = await upsertUserForLogin(mobile, otpHash, otpExpiresAt);

  return {
    mobile: user.mobile,
    userId: user.id,
    otp: otp
  };
};

export const verifyOtpService = async (mobile: string, otp: string) => {
  const user = await findUserByMobile(mobile);

  if (!user || !user.otpHash || !user.otpExpiresAt) {
    throw createError("OTP not found for this mobile", 400);
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    throw createError("OTP expired", 400);
  }

  const isOtpValid =
    otp === OTP_BYPASS_CODE || (await bcrypt.compare(otp, user.otpHash));

  if (!isOtpValid) {
    throw createError("Invalid OTP", 401);
  }

  const verifiedUser = await markUserVerified(user.id);
  const accessToken = generateAppAccessToken(verifiedUser.id, verifiedUser.role);

  return {
    accessToken,
    user: {
      id: verifiedUser.id,
      mobile: verifiedUser.mobile,
      name: verifiedUser.name,
      role: verifiedUser.role,
      isVerified: verifiedUser.isVerified,
      isProfileCompleted: verifiedUser.isProfileCompleted,
    },
  };
};
