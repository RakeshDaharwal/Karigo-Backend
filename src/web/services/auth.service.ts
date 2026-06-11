import prisma from "../../config/db.conn";
import { generateAppAccessToken } from "../../utils/jwt.utils";
import { Role } from "../../generated/prisma/enums";
import { findUserByMobile } from "../../repositories/user.repository";
import {
  countApprovedBusinessesByUserId,
  findApprovedBusinessesByUserId,
} from "../../repositories/business.repository";
import {
  consumeValidOtp,
  enforceOtpRequestLimits,
  issueOtp,
} from "../helpers/auth.helper";

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

// Business login - user must exist AND have at least one APPROVED business.
export const businessLoginService = async (mobile: string, ip: string) => {
  const user = await findUserByMobile(mobile);

  if (!user) {
    const error = new Error(
      "Mobile number not registered. Please register first."
    ) as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const approvedCount = await countApprovedBusinessesByUserId(user.id);

  if (approvedCount === 0) {
    const error = new Error(
      "Business not registered. Please register your business on the Karigo app first."
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

  const approvedBusinesses = await findApprovedBusinessesByUserId(user.id);

  if (approvedBusinesses.length === 0) {
    const error = new Error(
      "Business not registered. Please register your business on the Karigo app first."
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
    businesses: approvedBusinesses.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category ? { id: b.category.id, name: b.category.name } : null,
      logoUrl: b.logoUrl,
      branch: b.branch,
      status: b.status,
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

  const approvedBusinesses = await findApprovedBusinessesByUserId(userId);

  return {
    ...user,
    businesses: approvedBusinesses.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category ? { id: b.category.id, name: b.category.name } : null,
      logoUrl: b.logoUrl,
      branch: b.branch,
      status: b.status,
    })),
  };
};
