import prisma from "../../../config/db.conn";


export const upsertVerifiedUserByMobile = (mobile: string) => {
  return prisma.user.upsert({
    where: { mobile },
    update: {
      isVerified: true,
    },
    create: {
      mobile,
      isVerified: true,
    },
  });
};
