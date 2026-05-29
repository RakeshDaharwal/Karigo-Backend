import { Role } from "../../generated/prisma/enums";
import { countUsersByRole } from "../../repositories/analytics.repository";

export const getDashboardOverviewService = async () => {
  const [totalUsers, totalWorkers] = await Promise.all([
    countUsersByRole(Role.USER),
    countUsersByRole(Role.WORKER),
  ]);

  return {
    totalUsers,
    totalWorkers,
  };
};
