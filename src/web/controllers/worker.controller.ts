import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import { reviewWorkerRequestService } from "../services/worker.service";
import { ReviewWorkerRequestInput } from "../validation/worker.validation";

export const reviewWorkerRequest = async (
  req: Request<{ workerId: string }, {}, ReviewWorkerRequestInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workerId } = req.params;
    const { status } = req.body;

    const data = await reviewWorkerRequestService(workerId, status);

    logInfo("Worker application reviewed", {
      service: "worker",
      event: "WORKER_REQUEST_REVIEWED",
      workerId,
      decision: status,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        status === "APPROVED"
          ? "Worker application approved"
          : "Worker application rejected",
      data,
    });
  } catch (error: any) {
    logError("Worker application review failed", {
      service: "worker",
      event: "WORKER_REQUEST_REVIEW_FAILED",
      workerId: req.params.workerId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
