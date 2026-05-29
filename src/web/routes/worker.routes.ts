import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../middlewares/auth.middleware";
import {
  getWorkerDetails,
  getWorkerStats,
  listWorkers,
  reviewWorkerRequest,
} from "../controllers/worker.controller";
import { reviewWorkerRequestSchema } from "../validation/worker.validation";

const router = express.Router();

router.get("/stats", requireSuperAdmin, getWorkerStats);
router.get("/list", requireSuperAdmin, listWorkers);
router.get("/:workerId", requireSuperAdmin, getWorkerDetails);

router.patch(
  "/:workerId/review",
  requireSuperAdmin,
  validate(reviewWorkerRequestSchema, "REVIEW_WORKER_REQUEST_VALIDATION_FAILED", "worker"),
  reviewWorkerRequest
);

export default router;
