import prisma from "../config/db.conn";
import { Role } from "../generated/prisma/enums";

export const countUsersByRole = (role: Role) => {
  return prisma.user.count({
    where: { role },
  });
};
