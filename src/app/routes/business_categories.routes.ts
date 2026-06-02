import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware";
import { categoriesRateLimit } from "../../middlewares/rateLimit/redis.limits";
import { getBusinessCategories } from "../controllers/business_categories.controller";

const router = express.Router();

router.get("/all", categoriesRateLimit, verifyToken, getBusinessCategories);

export default router;
