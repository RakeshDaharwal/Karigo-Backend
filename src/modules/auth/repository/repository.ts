import prisma from "../../../config/db.conn";

export const findUserByMobile = (mobile: string) => {
  return prisma.user.findUnique({
    where: { mobile },
  });
};

export const upsertUserForLogin = async (
  mobile: string,
  otpHash: string,
  otpExpiresAt: Date
) => {
  const existingUser = await findUserByMobile(mobile);

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        otpHash,
        otpExpiresAt,
      },
    });
  }

  return prisma.user.create({
    data: {
      mobile,
      otpHash,
      otpExpiresAt,
    },
  });
};

export const markUserVerified = (userId: number) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: true,
      otpHash: null,
      otpExpiresAt: null,
    },
  });
};
