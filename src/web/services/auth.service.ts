import prisma from "../../config/db.conn";
import { generateAppAccessToken } from "../../utils/jwt.utils";
import { env } from "../../config/env";
import { Role } from "../../generated/prisma/enums";
import { findUserByMobile } from "../../repositories/user.repository";
import {
  countApprovedShopsByUserId,
  findApprovedShopsByUserId,
} from "../../repositories/shop.repository";
import {
  deleteOtpRecord,
  getOtpRecord,
  incrementIpOtpLimit,
  incrementMobileOtpLimit,
  isBypassOtp,
  isOtpCooldownActive,
  otpsMatch,
  setOtpCooldown,
  setOtpRecord,
  updateOtpAttemptsKeepingTtl,
} from "../helpers/auth.helper";

const OTP_MOBILE_LIMIT_MAX = env.otpMobileLimitMax;
const OTP_IP_LIMIT_MAX = env.otpIpLimitMax;
const OTP_MAX_ATTEMPTS = env.otpMaxAttempts;

// Shared OTP request guards (rate limit, cooldown). Throws on violation.
const enforceOtpRequestLimits = async (mobile: string, ip: string) => {
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
    const error = new Error(
      "Too many OTP requests from this IP. Try after 1 minute."
    ) as Error & { statusCode: number };
    error.statusCode = 429;
    throw error;
  }

  if (await isOtpCooldownActive(mobile)) {
    const error = new Error(
      "OTP already sent recently. Please wait 30 seconds."
    ) as Error & { statusCode: number };
    error.statusCode = 429;
    throw error;
  }
};

// Shared OTP verification flow. Returns void; throws on bad/expired/invalid.
const consumeValidOtp = async (mobile: string, otp: string) => {
  if (isBypassOtp(otp)) {
    await deleteOtpRecord(mobile);
    return;
  }

  const otpRecord = await getOtpRecord(mobile);
  if (!otpRecord) {
    const error = new Error("OTP expired or not found") as Error & {
      statusCode: number;
    };
    error.statusCode = 400;
    throw error;
  }

  if (!otpsMatch(otpRecord.otp, otp)) {
    const updatedAttempts = otpRecord.attempts + 1;

    if (updatedAttempts >= OTP_MAX_ATTEMPTS) {
      await deleteOtpRecord(mobile);
      const error = new Error("Too many incorrect attempts") as Error & {
        statusCode: number;
      };
      error.statusCode = 429;
      throw error;
    }

    const otpUpdated = await updateOtpAttemptsKeepingTtl(
      mobile,
      updatedAttempts
    );
    if (!otpUpdated) {
      const error = new Error("OTP expired or not found") as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }

    const error = new Error("Invalid OTP") as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  await deleteOtpRecord(mobile);
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendSMS = async (mobile: string, otp: string) => {
  console.log(`Sending OTP ${otp} to mobile ${mobile}`);
};

// Generates and persists (or reuses) an OTP, then "sends" it via SMS.
// Returns whether a fresh OTP was created or the in-flight one was reused.
const issueOtp = async (mobile: string) => {
  const existingOtp = await getOtpRecord(mobile);
  const otpToSend = existingOtp?.otp ?? generateOtp();

  if (!existingOtp) {
    await setOtpRecord(mobile, { otp: otpToSend, attempts: 0 });
  }

  await sendSMS(mobile, otpToSend);
  await setOtpCooldown(mobile);

  return { otpReused: Boolean(existingOtp) };
};

export const superAdminLoginService = async (mobile: string, ip: string) => {
  const superAdminUser = await findUserByMobile(mobile);

  if (!superAdminUser) {
    const error = new Error(
      "Mobile number not registered. Please register first."
    ) as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  if (superAdminUser.role !== Role.SUPER_ADMIN) {
    const error = new Error("Access denied. Super admin only") as Error & {
      statusCode: number;
    };
    error.statusCode = 403;
    throw error;
  }

  await enforceOtpRequestLimits(mobile, ip);
  const { otpReused } = await issueOtp(mobile);

  return { mobile, otpReused };
};

export const verifySuperAdminOtpService = async (
  mobile: string,
  otp: string
) => {
  await consumeValidOtp(mobile, otp);

  const superAdminUser = await findUserByMobile(mobile);

  if (!superAdminUser) {
    const error = new Error(
      "Mobile number not registered. Please register first."
    ) as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  if (superAdminUser.role !== Role.SUPER_ADMIN) {
    const error = new Error("Access denied. Super admin only") as Error & {
      statusCode: number;
    };
    error.statusCode = 403;
    throw error;
  }

  const accessToken = generateAppAccessToken(
    superAdminUser.id,
    superAdminUser.role
  );

  return {
    accessToken,
    principal: "SUPER_ADMIN" as const,
    user: {
      id: superAdminUser.id,
      mobile: superAdminUser.mobile,
      role: superAdminUser.role,
      firstName: superAdminUser.firstName,
      lastName: superAdminUser.lastName,
      profileImage: superAdminUser.profileImage,
      isVerified: superAdminUser.isVerified,
      isProfileCompleted: superAdminUser.isProfileCompleted,
    },
  };
};

export const getSuperAdminProfileService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      mobile: true,
      role: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      isVerified: true,
      isProfileCompleted: true,
    },
  });

  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return user;
};

// Business login - user must exist AND have at least one APPROVED shop.
export const businessLoginService = async (mobile: string, ip: string) => {
  const user = await findUserByMobile(mobile);

  if (!user) {
    const error = new Error(
      "Mobile number not registered. Please register first."
    ) as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const approvedCount = await countApprovedShopsByUserId(user.id);

  if (approvedCount === 0) {
    const error = new Error(
      "Shop not registered. Please register your shop on the Karigo app first."
    ) as Error & { statusCode: number };
    error.statusCode = 403;
    throw error;
  }

  await enforceOtpRequestLimits(mobile, ip);
  const { otpReused } = await issueOtp(mobile);

  return { mobile, otpReused };
};

export const verifyBusinessOtpService = async (mobile: string, otp: string) => {
  await consumeValidOtp(mobile, otp);

  const user = await findUserByMobile(mobile);

  if (!user) {
    const error = new Error(
      "Mobile number not registered. Please register first."
    ) as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const approvedShops = await findApprovedShopsByUserId(user.id);

  if (approvedShops.length === 0) {
    const error = new Error(
      "Shop not registered. Please register your shop on the Karigo app first."
    ) as Error & { statusCode: number };
    error.statusCode = 403;
    throw error;
  }

  const accessToken = generateAppAccessToken(user.id, user.role);

  return {
    accessToken,
    principal: "BUSINESS" as const,
    user: {
      id: user.id,
      mobile: user.mobile,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      isProfileCompleted: user.isProfileCompleted,
    },
    shops: approvedShops.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      logoUrl: s.logoUrl,
      branch: s.branch,
      status: s.status,
    })),
  };
};

export const getBusinessProfileService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      mobile: true,
      role: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      isVerified: true,
      isProfileCompleted: true,
    },
  });

  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const approvedShops = await findApprovedShopsByUserId(userId);

  return {
    ...user,
    shops: approvedShops.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      logoUrl: s.logoUrl,
      branch: s.branch,
      status: s.status,
    })),
  };
};
