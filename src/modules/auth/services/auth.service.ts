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
    const error = new Error(
      "Too many OTP requests for this mobile. Try after 1 hour."
    ) as Error & { statusCode: number };
    error.statusCode = 429;
    throw error;
  }

  if (ipRequestCount > OTP_IP_LIMIT_MAX) {
    const error = new Error("Too many OTP requests from this IP. Try after 1 minute.") as Error & {
      statusCode: number;
    };
    error.statusCode = 429;
    throw error;
  }

  const cooldownActive = await isOtpCooldownActive(mobile);

  if (cooldownActive) {
    const error = new Error("OTP already sent recently. Please wait 30 seconds.") as Error & {
      statusCode: number;
    };
    error.statusCode = 429;
    throw error;
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
    const error = new Error("OTP expired or not found") as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  if (otpRecord.otp !== otp) {
    const updatedAttempts = otpRecord.attempts + 1;

    if (updatedAttempts >= OTP_MAX_ATTEMPTS) {
      await deleteOtpRecord(mobile);
      const error = new Error("Too many incorrect attempts") as Error & { statusCode: number };
      error.statusCode = 429;
      throw error;
    }

    const otpUpdated = await updateOtpAttemptsKeepingTtl(mobile, updatedAttempts);
    if (!otpUpdated) {
      const error = new Error("OTP expired or not found") as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    const error = new Error("Invalid OTP") as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
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
