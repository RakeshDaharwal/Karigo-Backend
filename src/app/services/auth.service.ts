import { ulid } from "ulid";
import { findUserByMobile, upsertVerifiedUserByMobile } from "../../repositories/user.repository";
import { generateAppAccessToken } from "../../utils/jwt.utils";
import { sendOtpSms } from "../../utils/sms.utils";
import { env } from "../../config/env";
import {
  deleteOtpRecord,
  getOtpRecord,
  isBypassOtp,
  isOtpCooldownActive,
  otpsMatch,
  setOtpCooldown,
  setOtpRecord,
  updateOtpAttemptsKeepingTtl,
} from "../../web/helpers/auth.helper";

const OTP_MAX_ATTEMPTS = env.otpMaxAttempts;

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendSMS = async (mobile: string, otp: string) => {
  await sendOtpSms(mobile, otp);
};

export const userLoginService = async (mobile: string, _ip: string) => {
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
  if (!isBypassOtp(otp)) {
    const otpRecord = await getOtpRecord(mobile);
    if (!otpRecord) {
      const error = new Error("OTP expired or not found") as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    if (!otpsMatch(otpRecord.otp, otp)) {
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
  }

  await deleteOtpRecord(mobile);

  const verifiedUser = await upsertVerifiedUserByMobile(mobile, ulid());
  const accessToken = generateAppAccessToken(verifiedUser.id, verifiedUser.role);

  return {
    accessToken,
    user: verifiedUser,
  };
};
