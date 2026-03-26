import { upsertVerifiedUserByMobile } from "../repository/repository";
import { generateAppAccessToken } from "../../../utils/jwt.utils";
import { env } from "../../../config/env";
import {
  deleteOtpRecord,
  getOtpRecord,
  incrementIpOtpLimit,
  incrementMobileOtpLimit,
  isOtpCooldownActive,
  setOtpCooldown,
  setOtpRecord,
  updateOtpAttemptsKeepingTtl,
} from "../helpers/auth.helper";

const OTP_MOBILE_LIMIT_MAX = env.otpMobileLimitMax;
const OTP_IP_LIMIT_MAX = env.otpIpLimitMax;
const OTP_MAX_ATTEMPTS = env.otpMaxAttempts;

const createError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendSMS = async (mobile: string, otp: string) => {
  // Hook your SMS provider here. For high volume, this can be queued via BullMQ.
  console.log(`Sending OTP ${otp} to mobile ${mobile}`);
};

export const userLoginService = async (mobile: string, ip: string) => {
  const [mobileRequestCount, ipRequestCount] = await Promise.all([
    incrementMobileOtpLimit(mobile),
    incrementIpOtpLimit(ip),
  ]);

  if (mobileRequestCount > OTP_MOBILE_LIMIT_MAX) {
    throw createError("Too many OTP requests for this mobile. Try after 1 hour.", 429);
  }

  if (ipRequestCount > OTP_IP_LIMIT_MAX) {
    throw createError("Too many OTP requests from this IP. Try after 1 minute.", 429);
  }

  const cooldownActive = await isOtpCooldownActive(mobile);

  if (cooldownActive) {
    throw createError("OTP already sent recently. Please wait 30 seconds.", 429);
  }

  const existingOtp = await getOtpRecord(mobile);
  const otpToSend = existingOtp?.otp ?? generateOtp();

  if (!existingOtp) {
    await setOtpRecord(mobile, { otp: otpToSend, attempts: 0 });
  }

  await sendSMS(mobile, otpToSend);
  await setOtpCooldown(mobile);

  return {
    mobile,
    otpReused: Boolean(existingOtp),
  };
};

export const verifyOtpService = async (mobile: string, otp: string) => {
  const otpRecord = await getOtpRecord(mobile);
  if (!otpRecord) {
    throw createError("OTP expired or not found", 400);
  }

  if (otpRecord.otp !== otp) {
    const updatedAttempts = otpRecord.attempts + 1;

    if (updatedAttempts >= OTP_MAX_ATTEMPTS) {
      await deleteOtpRecord(mobile);
      throw createError("Too many incorrect attempts", 429);
    }

    const otpUpdated = await updateOtpAttemptsKeepingTtl(mobile, updatedAttempts);
    if (!otpUpdated) {
      throw createError("OTP expired or not found", 400);
    }

    throw createError("Invalid OTP", 401);
  }

  await deleteOtpRecord(mobile);

  // Database is accessed only after OTP validation succeeds.
  const verifiedUser = await upsertVerifiedUserByMobile(mobile);
  const accessToken = generateAppAccessToken(verifiedUser.id, verifiedUser.role);

  return {
    accessToken,
    user: {
      id: verifiedUser.id,
      mobile: verifiedUser.mobile,
      role: verifiedUser.role,
      isVerified: verifiedUser.isVerified,
      isProfileCompleted: verifiedUser.isProfileCompleted,
    },
  };
};
