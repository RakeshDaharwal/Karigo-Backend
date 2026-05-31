import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { verifyToken } from "../../middlewares/auth.middleware";
import { workersRateLimit } from "../../middlewares/rateLimit/redis.limits";
import { getWorkersByCategoryNearby } from "../controllers/workers.controller";
import { workersByCategoryBodySchema } from "../validation/workers.validation";

const router = express.Router();

router.post(
  "/category/:categoryId",
  workersRateLimit,
  verifyToken,
  validate(workersByCategoryBodySchema, "WORKERS_BY_CATEGORY_BODY_VALIDATION_FAILED", "workers"),
  getWorkersByCategoryNearby
);

export default router;
