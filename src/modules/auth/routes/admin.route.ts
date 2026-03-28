import express from "express";
import { validate } from "../../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../../middlewares/auth.middleware";
import { reviewWorkerRequest } from "../controllers/worker-admin.controller";
import { reviewWorkerRequestSchema } from "../validation/worker-admin.validation";

const router = express.Router();

router.patch(
  "/workers/:workerId/review",
  requireSuperAdmin,
  validate(reviewWorkerRequestSchema, "REVIEW_WORKER_REQUEST_VALIDATION_FAILED", "admin"),
  reviewWorkerRequest
);

export default router;
