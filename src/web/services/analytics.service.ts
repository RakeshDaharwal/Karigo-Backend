import prisma from "../../config/db.conn";
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

// Business overview for the logged-in business owner.
// Orders/revenue are placeholders (no orders model yet); totals are 0
// but the response shape stays stable for the frontend cards.
export const getBusinessOverviewService = async (userId: string) => {
  const businesses = await prisma.business.findMany({
    where: { userId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return {
    totalOrders: 0,
    totalRevenue: 0,
    businessesCount: businesses.length,
    businesses: businesses.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category ? { id: b.category.id, name: b.category.name } : null,
    })),
  };
};
