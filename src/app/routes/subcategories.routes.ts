import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware";
import { categoriesRateLimit } from "../../middlewares/rateLimit/redis.limits";
import { getSubCategoriesByCategoryId } from "../controllers/subcategories.controller";

const router = express.Router();

router.get(
  "/by-category/:categoryId",
  categoriesRateLimit,
  verifyToken,
  getSubCategoriesByCategoryId
);

export default router;
