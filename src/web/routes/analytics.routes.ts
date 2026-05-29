import express from "express";
import { requireSuperAdmin } from "../../middlewares/auth.middleware";
import { getDashboardOverview } from "../controllers/analytics.controller";

const router = express.Router();

router.get("/overview", requireSuperAdmin, getDashboardOverview);

export default router;
