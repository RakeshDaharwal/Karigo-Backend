import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import workerRoutes from "./routes/worker.routes";
import categoriesRoutes, {
  subcategoriesRoutes,
} from "./routes/categories.routes";
import businessCategoriesRoutes from "./routes/business_categories.routes";
import analyticsRoutes from "./routes/analytics.routes";
import businessRoutes from "./routes/business.routes";
import storeRoutes from "./routes/store.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/worker", workerRoutes);
router.use("/categories", categoriesRoutes);
router.use("/subcategories", subcategoriesRoutes);
router.use("/business-categories", businessCategoriesRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/business/stores", storeRoutes);
router.use("/business", businessRoutes);

export default router;
