import prisma from "../../../config/db.conn";

export const findUserByMobile = (mobile: string) => {
  return prisma.user.findUnique({
    where: { mobile },
  });
};

export const upsertVerifiedUserByMobile = (mobile: string, id: string) => {
  return prisma.user.upsert({
    where: { mobile },
    update: {
      isVerified: true,
    },
    create: {
      id,
      mobile,
      isVerified: true,
    },
  });
};
