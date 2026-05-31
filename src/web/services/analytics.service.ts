import { Role } from "../../generated/prisma/enums";
import { countUsersByRole } from "../../repositories/analytics.repository";
import { findApprovedShopsByUserId } from "../../repositories/shop.repository";

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

// Business overview for the logged-in shop owner.
// Orders/revenue are placeholders (no orders model yet); totals are 0
// but the response shape stays stable for the frontend cards.
export const getBusinessOverviewService = async (userId: string) => {
  const shops = await findApprovedShopsByUserId(userId);

  return {
    totalOrders: 0,
    totalRevenue: 0,
    shopsCount: shops.length,
    shops: shops.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
    })),
  };
};
