import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../middlewares/auth.middleware";
import { reviewWorkerRequest } from "../controllers/worker.controller";
import { reviewWorkerRequestSchema } from "../validation/worker.validation";

const router = express.Router();

router.patch(
  "/:workerId/review",
  requireSuperAdmin,
  validate(reviewWorkerRequestSchema, "REVIEW_WORKER_REQUEST_VALIDATION_FAILED", "worker"),
  reviewWorkerRequest
);

export default router;
