import express from "express";
import {
  requireBusinessUser,
  requireSuperAdmin,
} from "../../middlewares/auth.middleware";
import {
  getBusinessOverview,
  getDashboardOverview,
} from "../controllers/analytics.controller";

const router = express.Router();

router.get("/overview", requireSuperAdmin, getDashboardOverview);
router.get("/business/overview", requireBusinessUser, getBusinessOverview);

export default router;
