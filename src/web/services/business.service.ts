import prisma from "../../config/db.conn";
import { BusinessCategory } from "../../generated/prisma/enums";
import {
  countBusinessStatuses,
  findBusinessByIdDetailed,
  listBusinessesByFilters,
  BusinessStatus,
} from "../../repositories/business.repository";

export const getBusinessStatsService = async () => {
  return countBusinessStatuses();
};

export const listBusinessesService = async (params: {
  status: BusinessStatus;
  category?: BusinessCategory;
  search?: string;
}) => {
  const businesses = await listBusinessesByFilters(params);

  return businesses.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    category: b.category,
    contactPhone: b.contactPhone,
    logoUrl: b.logoUrl,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    owner: {
      id: b.user.id,
      mobile: b.user.mobile,
      firstName: b.user.firstName,
      lastName: b.user.lastName,
      fullName:
        [b.user.firstName, b.user.lastName].filter(Boolean).join(" ").trim() ||
        null,
    },
  }));
};

export const getBusinessDetailsService = async (businessId: string) => {
  const business = await findBusinessByIdDetailed(businessId);

  if (!business) {
    const err = new Error("Business not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return {
    id: business.id,
    name: business.name,
    description: business.description,
    category: business.category,
    contactPhone: business.contactPhone,
    logoUrl: business.logoUrl,
    status: business.status,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
    owner: {
      id: business.user.id,
      mobile: business.user.mobile,
      firstName: business.user.firstName,
      lastName: business.user.lastName,
      fullName:
        [business.user.firstName, business.user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || null,
      profileImage: business.user.profileImage,
      createdAt: business.user.createdAt,
    },
  };
};

export const reviewBusinessRequestService = async (
  businessId: string,
  decision: "APPROVED" | "REJECT"
) => {
  const business = await prisma.business.findUnique({ where: { id: businessId } });

  if (!business) {
    const err = new Error("Business not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (business.status !== "PENDING") {
    const err = new Error("Business is not pending review") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const nextStatus = decision === "REJECT" ? "REJECTED" : "APPROVED";

  return prisma.business.update({
    where: { id: businessId },
    data: { status: nextStatus },
    include: {
      user: {
        select: {
          id: true,
          mobile: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};
