import prisma from "../../config/db.conn";
import { PartnerType, Role } from "../../generated/prisma/enums";
import {
  countWorkerStatuses,
  findSubCategoriesByIds,
  findWorkerByIdDetailed,
  listWorkersByFilters,
  WorkerStatus,
} from "../../repositories/worker.repository";

export const getWorkerStatsService = async () => {
  return countWorkerStatuses();
};

export const listWorkersService = async (params: {
  status: WorkerStatus;
  partnerType?: PartnerType;
  search?: string;
}) => {
  const workers = await listWorkersByFilters(params);

  return workers.map((w) => ({
    id: w.id,
    firstName: w.firstName,
    lastName: w.lastName,
    fullName: [w.firstName, w.lastName].filter(Boolean).join(" ").trim() || null,
    mobile: w.mobile,
    branch: w.branch,
    partnerType: w.partnerType,
    businessName: w.businessName,
    profileImage: w.profileImage,
    status: w.status,
    createdAt: w.createdAt,
    category: w.category,
  }));
};

export const getWorkerDetailsService = async (workerId: string) => {
  const worker = await findWorkerByIdDetailed(workerId);

  if (!worker) {
    const err = new Error("Partner application not found") as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }

  const subs = await findSubCategoriesByIds(worker.subCategoryIds);
  const subById = new Map(subs.map((s) => [s.id, s.name]));

  return {
    id: worker.id,
    status: worker.status,
    partnerType: worker.partnerType,
    businessName: worker.businessName,
    firstName: worker.firstName,
    lastName: worker.lastName,
    fullName:
      [worker.firstName, worker.lastName].filter(Boolean).join(" ").trim() ||
      null,
    mobile: worker.mobile,
    gender: worker.gender,
    dateOfBirth: worker.dateOfBirth,
    branch: worker.branch,
    latitude: worker.latitude,
    longitude: worker.longitude,
    profileImage: worker.profileImage,
    aadhaarImageUrl: worker.aadhaarImageUrl,
    createdAt: worker.createdAt,
    updatedAt: worker.updatedAt,
    category: worker.category,
    subCategories: worker.subCategoryIds.map((id) => ({
      id,
      name: subById.get(id) ?? null,
    })),
    user: worker.user,
  };
};

export const reviewWorkerRequestService = async (
  workerId: string,
  decision: "APPROVED" | "REJECT"
) => {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
  });

  if (!worker) {
    const err = new Error("Worker application not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (worker.status !== "PENDING") {
    const err = new Error("Application is not pending") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  if (decision === "REJECT") {
    return prisma.worker.update({
      where: { id: workerId },
      data: { status: "REJECTED" },
      include: {
        user: true,
        category: true,
      },
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: worker.userId },
      data: { role: Role.WORKER },
    });

    return tx.worker.update({
      where: { id: workerId },
      data: { status: "APPROVED" },
      include: {
        user: true,
        category: true,
      },
    });
  });
};
