import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware";
import { categoriesRateLimit } from "../../middlewares/rateLimit/redis.limits";
import {
  getCategories,
  getSubCategoriesByCategoryId,
} from "../controllers/categories.controller";

const router = express.Router();

router.get("/all", categoriesRateLimit, verifyToken, getCategories);

export const subcategoriesRoutes = express.Router();

subcategoriesRoutes.get(
  "/by-category/:categoryId",
  categoriesRateLimit,
  verifyToken,
  getSubCategoriesByCategoryId
);

export default router;
