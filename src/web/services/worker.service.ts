import prisma from "../../config/db.conn";
import { Role } from "../../generated/prisma/enums";

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
