import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../../utils/logger.utils";
import { getApprovedWorkersByCategoryNearby } from "../services/workers.service";
import { WorkersByCategoryBody } from "../validation/workers.validation";

export const getWorkersByCategoryNearby = async (
  req: Request<{ categoryId: string }, {}, WorkersByCategoryBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId } = req.params;
    const { latitude, longitude } = req.body;

    const data = await getApprovedWorkersByCategoryNearby(
      categoryId,
      latitude,
      longitude
    );

    logInfo("Workers by category (nearby) fetched", {
      service: "workers",
      event: "WORKERS_BY_CATEGORY_NEARBY_SUCCESS",
      categoryId,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Workers fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("Workers by category (nearby) failed", {
      service: "workers",
      event: "WORKERS_BY_CATEGORY_NEARBY_FAILED",
      categoryId: req.params.categoryId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
