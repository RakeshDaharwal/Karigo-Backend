import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  getWorkerDetailsService,
  getWorkerStatsService,
  listWorkersService,
  reviewWorkerRequestService,
} from "../services/worker.service";
import {
  listWorkersQuerySchema,
  ReviewWorkerRequestInput,
  workerIdParamSchema,
} from "../validation/worker.validation";

export const getWorkerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getWorkerStatsService();

    logInfo("Worker stats fetched", {
      service: "worker",
      event: "GET_WORKER_STATS_SUCCESS",
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Partner stats fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("Worker stats fetch failed", {
      service: "worker",
      event: "GET_WORKER_STATS_FAILED",
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const listWorkers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = listWorkersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const err = new Error(parsed.error.issues[0].message) as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }

    const data = await listWorkersService(parsed.data);

    logInfo("Workers listed", {
      service: "worker",
      event: "LIST_WORKERS_SUCCESS",
      status: parsed.data.status,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Partners fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("List workers failed", {
      service: "worker",
      event: "LIST_WORKERS_FAILED",
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getWorkerDetails = async (
  req: Request<{ workerId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = workerIdParamSchema.safeParse({ workerId: req.params.workerId });
    if (!parsed.success) {
      const err = new Error(parsed.error.issues[0].message) as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }

    const data = await getWorkerDetailsService(parsed.data.workerId);

    logInfo("Worker details fetched", {
      service: "worker",
      event: "GET_WORKER_DETAILS_SUCCESS",
      workerId: parsed.data.workerId,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Partner details fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("Worker details fetch failed", {
      service: "worker",
      event: "GET_WORKER_DETAILS_FAILED",
      workerId: req.params?.workerId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

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
